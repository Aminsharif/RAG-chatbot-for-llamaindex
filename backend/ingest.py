import logging
import os
from dotenv import load_dotenv
load_dotenv()
import sys

print("Python version:")
print(sys.version)
from parser import langchain_docs_extractor
import chromadb
from langchain_community.vectorstores import Chroma
from bs4 import BeautifulSoup, SoupStrainer
from constants import CHORAMA_DOCS_INDEX_NAME

from langchain_community.document_loaders import SitemapLoader, RecursiveUrlLoader
from embeddings import get_embeddings_model
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.utils.html import PREFIXES_TO_IGNORE_REGEX, SUFFIXES_TO_IGNORE_REGEX
from langchain_community.indexes._sql_record_manager import SQLRecordManager
from langchain_core.indexing import index

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__) 

def metadata_extractor(meta: dict, soup: BeautifulSoup) -> dict:
    title = soup.find("title")
    description = soup.find("meta", attrs={"name": "description"})
    html = soup.find("html")
    return {
        "source": meta["loc"],
        "title": title.get_text() if title else "",
        "description": description.get("content", "") if description else "",
        "language": html.get("lang", "") if html else "",
        **meta,
    }

def load_python_sitemap_docs():
    return SitemapLoader(
        "https://developers.llamaindex.ai/sitemap.xml",
        filter_urls=["https://developers.llamaindex.ai"],
        parsing_function=langchain_docs_extractor,
        default_parser="lxml",
         bs_kwargs={
            "parse_only": SoupStrainer(
                name=("article", "title", "html", "lang", "content")
            ),
        },
        meta_function=metadata_extractor,
    ).load()

def ingest_docs():
    RECORD_MANAGER_DB_URL = os.getenv("RECORD_MANAGER_DB_URL")
    text_spliter = RecursiveCharacterTextSplitter(chunk_size=4000, chunk_overlap=200)
    embedding = get_embeddings_model()

    client = chromadb.PersistentClient(path="./chroma_db")

    try:
        vectorstore = Chroma(
        client=client,
        collection_name=CHORAMA_DOCS_INDEX_NAME,
        embedding_function=embedding,
        # persist_directory="./chroma_db",  # Only if using Chroma() directly without client
    )
        
        record_manager = SQLRecordManager(
            f"chroma/{CHORAMA_DOCS_INDEX_NAME}", db_url=RECORD_MANAGER_DB_URL
        )

        record_manager.create_schema()

        docs_from_documentation = load_python_sitemap_docs()
        logger.info(f"Loaded {len(docs_from_documentation)} docs from documentation")
        

        docs_transformed = text_spliter.split_documents(
            docs_from_documentation
        )
        docs_transformed = [doc for doc in docs_transformed if len(doc.page_content) > 10]

        # We try to return 'source' and 'title' metadata when querying vector store and
        # Weaviate will error at query time if one of the attributes is missing from a
        # retrieved document.
        for doc in docs_transformed:
            if "source" not in doc.metadata:
                doc.metadata["source"] = ""
            if "title" not in doc.metadata:
                doc.metadata["title"] = ""

        indexing_stats = index(
            docs_transformed,
            record_manager,
            vectorstore,
            cleanup="full",
            source_id_key="source",
            force_update=(os.environ.get("FORCE_UPDATE") or "false").lower() == "true",
        )

        logger.info(f"Indexing stats: {indexing_stats}")
        
        # Get vector count - note the different syntax for WeaviateClient
        collections = client.collections.list_all()
        langchain_collection = client.collections.get(CHORAMA_DOCS_INDEX_NAME)
        num_objects = langchain_collection.aggregate.over_all(total_count=True)
        
        logger.info(
            f"LangChain now has this many vectors: {num_objects.total_count}",
        )
        
    except Exception as e:
        logger.info(f"Indexing stats: {e}")

if __name__ == "__main__":
    ingest_docs()