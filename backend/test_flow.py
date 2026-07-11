import asyncio
import sys
import os

sys.path.append(os.path.abspath('.'))
from app.core.database import connect_to_mongo, close_mongo_connection, db_instance
from app.services import book_service

async def check():
    await connect_to_mongo()
    db = db_instance.db
    # clear db for clean test
    await db.books.delete_many({})
    
    print('Testing search...')
    result = await book_service.search_books_openlibrary('lord of the rings', max_results=2)
    book_id = result['books'][0]['google_books_id']
    print('Search result ID:', book_id)
    
    print('Caching books like route does...')
    for book_data in result.get("books", []):
        await book_service.get_or_create_book(db, book_data["google_books_id"], book_data)
        
    print('Testing get_book_detail...')
    book = await book_service.get_book_by_id(db, book_id)
    if not book:
        print('Not found by ID, trying get_or_create_book...')
        book = await book_service.get_or_create_book(db, book_id)
    
    print('Book detail result title:', book.get('title') if book else None)
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check())
