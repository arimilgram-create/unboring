"""Check that your Meta API key works: python check_meta.py
Sends one tiny message to Muse Spark 1.3 and prints the reply. Never prints the key."""
import os
import sys

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
key = os.getenv("META_API_KEY")
if not key:
    sys.exit("No META_API_KEY in apps/server/.env yet. Add it there (copy .env.example to .env).")

client = OpenAI(api_key=key, base_url="https://api.meta.ai/v1")
reply = client.chat.completions.create(
    model="muse-spark-1.3", max_tokens=50,
    messages=[{"role": "user", "content": "Say hi to UnBoring in five words."}])
print("Muse Spark says:", reply.choices[0].message.content)
