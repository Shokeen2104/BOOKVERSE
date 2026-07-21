import urllib.request
import json

CATEGORIES = ["fiction", "fantasy", "science", "history", "mystery", "romance", "biography"]

def fetch_books():
    books = []
    seen_titles = set()
    
    for cat in CATEGORIES:
        print(f"Fetching {cat}...")
        url = f"https://openlibrary.org/search.json?subject={cat}&limit=10&sort=editions"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                for item in data.get("docs", []):
                    title = item.get("title", "Unknown")
                    if title in seen_titles:
                        continue
                        
                    ol_key = item.get("key", "").split("/")[-1]
                    if not ol_key: continue
                    
                    authors = item.get("author_name", ["Unknown"])
                    cover_id = item.get("cover_i")
                    cover = f"https://covers.openlibrary.org/b/id/{cover_id}-L.jpg" if cover_id else ""
                    
                    books.append({
                        "google_books_id": f"ol_{ol_key}",
                        "title": title,
                        "authors": authors,
                        "description": f"A highly rated {cat} book from the Open Library catalog.",
                        "cover_image": cover,
                        "isbn": item.get("isbn", [""])[0] if item.get("isbn") else None,
                        "categories": [cat.capitalize()],
                        "published_date": str(item.get("first_publish_year", "")),
                        "page_count": item.get("number_of_pages_median", 0),
                        "curated": True
                    })
                    seen_titles.add(title)
                    
                    if len(books) >= 48:
                        break
        except Exception as e:
            print(f"Error fetching {cat}: {e}")
            
        if len(books) >= 48:
            break
                
    return books[:48]

def main():
    books = fetch_books()
    with open("books.json", "w") as f:
        json.dump(books, f, indent=4)
    print("Done generating books.json")

if __name__ == "__main__":
    main()
