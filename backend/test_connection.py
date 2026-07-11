import httpx
import asyncio

async def test():
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {"q": "Harry Potter", "maxResults": 3}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            print("Status Code:", response.status_code)
            if response.status_code != 200:
                print("Response text:", response.text)
            else:
                data = response.json()
                print("Found items:", len(data.get("items", [])))
        except Exception as e:
            print("Failed to connect:", e)

if __name__ == "__main__":
    asyncio.run(test())
