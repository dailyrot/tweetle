"""
Tweetle Puzzle Generator

Reads raw tweet CSVs/JSON, filters for funny/absurd tweets,
and generates puzzle sets for the game.

Usage:
    python3 scripts/build_puzzles.py
    python3 scripts/build_puzzles.py --count 50
"""

import json
import os
import re
import random
import argparse
from pathlib import Path

import pandas as pd

SCRIPT_DIR = Path(__file__).parent
RAW_DIR = SCRIPT_DIR / "raw_data"
OUTPUT_PATH = SCRIPT_DIR.parent / "src" / "data" / "tweets.json"

CELEBRITIES = [
    {
        "name": "Donald Trump",
        "handle": "@realDonaldTrump",
        "source": "realdonaldtrump.csv",
        "text_col": "content",
        "id_col": "id",
        "link_col": "link",
    },
    {
        "name": "Elon Musk",
        "handle": "@elonmusk",
        "source": "TweetsElonMusk.csv",
        "text_col": "tweet",
        "id_col": "id",
        "link_col": "link",
    },
    {
        "name": "Kanye West",
        "handle": "@kanyewest",
        "source": "kanye_archive.json",
        "text_col": "text",
        "id_col": "id",
    },
    {
        "name": "Kim Kardashian",
        "handle": "@KimKardashian",
        "source": "KimKardashian.csv",
        "text_col": "content",
        "id_col": "id",
        "link_col": "url",
    },
    {
        "name": "50 Cent",
        "handle": "@50cent",
        "source": "twitter-celebrity-tweets-data/twitter-celebrity-tweets-data/50cent.csv",
        "text_col": "tweet",
        "id_col": "twitter_id",
    },
    {
        "name": "Snoop Dogg",
        "handle": "@SnoopDogg",
        "source": "twitter-celebrity-tweets-data/twitter-celebrity-tweets-data/SnoopDogg.csv",
        "text_col": "tweet",
        "id_col": "twitter_id",
    },
]


def clean_tweet(text: str) -> str:
    if not isinstance(text, str):
        return ""
    # Handle byte-string encoded tweets from celebrity dataset
    if text.startswith("b'") or text.startswith('b"'):
        text = text[2:-1]
        text = (
            text.replace("\\n", " ")
            .replace("\\xe2\\x80\\x99", "'")
            .replace("\\xe2\\x80\\x9c", '"')
            .replace("\\xe2\\x80\\x9d", '"')
            .replace("\\xe2\\x80\\xa6", "...")
            .replace("\\xe2\\x80\\x93", "-")
            .replace("\\xe2\\x80\\x94", "-")
            .replace("\\xe2\\x80\\x98", "'")
        )
        # Remove remaining hex escapes
        text = re.sub(r"\\x[0-9a-fA-F]{2}", "", text)
    # Remove t.co links
    text = re.sub(r"https?://t\.co/\S+", "", text)
    # Remove other URLs
    text = re.sub(r"https?://\S+", "", text)
    # Remove @mentions at the start
    text = re.sub(r"^(@\w+\s*)+", "", text)
    # Clean up whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_tweets(celeb: dict) -> pd.DataFrame:
    source_path = RAW_DIR / celeb["source"]
    if not source_path.exists():
        print(f"  WARNING: {source_path} not found, skipping")
        return pd.DataFrame(columns=["text", "tweet_id", "source_url"])

    if str(source_path).endswith(".json"):
        with open(source_path) as f:
            data = json.load(f)
        rows = []
        if isinstance(data, dict):
            for key, t in data.items():
                if isinstance(t, dict):
                    text = t.get("post_text", t.get("text", t.get("full_text", "")))
                    tid = t.get("id_str", t.get("id", key))
                    rows.append({"text": text, "tweet_id": str(tid)})
        elif isinstance(data, list):
            for t in data:
                text = t.get("text", t.get("full_text", ""))
                tid = t.get("id_str", t.get("id", ""))
                rows.append({"text": text, "tweet_id": str(tid)})
        df = pd.DataFrame(rows)
    else:
        df = pd.read_csv(source_path, on_bad_lines="skip")
        text_col = celeb["text_col"]
        id_col = celeb.get("id_col", "")
        link_col = celeb.get("link_col", "")

        df = df.rename(columns={text_col: "text"})
        if id_col and id_col in df.columns:
            df = df.rename(columns={id_col: "tweet_id"})
        else:
            df["tweet_id"] = ""

        if link_col and link_col in df.columns:
            df = df.rename(columns={link_col: "source_url"})
        else:
            df["source_url"] = ""

        df["tweet_id"] = df["tweet_id"].astype(str)

    df["text"] = df["text"].apply(clean_tweet)
    return df[["text", "tweet_id"]].copy()


def score_tweet(text: str) -> float:
    """Heuristic score for how 'unhinged' / funny / guessable a tweet is."""
    if not text or len(text) < 20:
        return 0
    if len(text) > 200:
        return 0

    score = 0.0

    # All caps words (shouting)
    caps_words = len(re.findall(r"\b[A-Z]{2,}\b", text))
    score += min(caps_words * 2, 8)

    # Exclamation marks
    score += min(text.count("!") * 1.5, 6)

    # Question marks (rhetorical questions)
    score += min(text.count("?") * 1, 4)

    # Self-referential (I, my, me)
    self_refs = len(re.findall(r"\b(I|my|me|myself)\b", text, re.IGNORECASE))
    score += min(self_refs * 1.5, 6)

    # Superlatives / strong language
    strong_words = len(
        re.findall(
            r"\b(best|worst|greatest|terrible|amazing|beautiful|tremendous|"
            r"huge|stupid|loser|hater|genius|god|perfect|never|always|"
            r"everyone|nobody|billion|million|love|hate|fake|sad|"
            r"incredible|fantastic|disaster|pathetic|weak|strong|"
            r"winning|losing|smart|dumb|crazy|insane|literally)\b",
            text,
            re.IGNORECASE,
        )
    )
    score += min(strong_words * 2, 10)

    # Length sweet spot (40-140 chars is ideal for the game)
    if 40 <= len(text) <= 140:
        score += 5
    elif 30 <= len(text) <= 180:
        score += 2

    # Kill boring or noisy patterns
    if text.startswith("RT "):
        return 0
    if re.match(r'^"?\s*@', text):
        return 0
    if text.startswith('"') and "@" in text[:30]:
        return 0
    if text.startswith("Thank"):
        score -= 3
    if "http" in text.lower():
        score -= 5
    if re.match(r"^\.@", text):
        return 0

    # Kill promos, sales, ads
    promo_words = re.findall(
        r"\b(sale|shop|buy|discount|coupon|promo|giveaway|merch|"
        r"available now|link in bio|out now|pre-?order|stream|"
        r"tune in|watch now|download|subscribe)\b",
        text,
        re.IGNORECASE,
    )
    if len(promo_words) >= 2:
        return 0
    score -= len(promo_words) * 3

    # Penalize tweets that are mostly mentions or hashtags
    mention_ratio = len(re.findall(r"@\w+", text)) / max(len(text.split()), 1)
    if mention_ratio > 0.3:
        return 0

    hashtag_count = len(re.findall(r"#\w+", text))
    if hashtag_count > 2:
        score -= hashtag_count * 2
    hashtag_ratio = hashtag_count / max(len(text.split()), 1)
    if hashtag_ratio > 0.3:
        return 0

    return max(score, 0)


def build_source_url(celeb: dict, tweet_id: str) -> str:
    """Construct a tweet URL from the handle and tweet ID."""
    if not tweet_id or tweet_id in ("", "nan", "None"):
        return ""
    handle = celeb["handle"].lstrip("@")
    return f"https://x.com/{handle}/status/{tweet_id}"


def get_top_tweets(celeb: dict, n: int = 100) -> list[dict]:
    """Load, score, and return top N tweets for a celebrity."""
    print(f"  Loading {celeb['name']}...")
    df = load_tweets(celeb)
    if df.empty:
        return []

    df["score"] = df["text"].apply(score_tweet)
    df = df[df["score"] > 0].sort_values("score", ascending=False)

    # Deduplicate similar tweets
    seen = set()
    unique = []
    for _, row in df.iterrows():
        normalized = row["text"].lower()[:60]
        if normalized not in seen:
            seen.add(normalized)
            unique.append(row)
        if len(unique) >= n:
            break

    results = []
    for row in unique:
        source_url = build_source_url(celeb, row.get("tweet_id", ""))
        results.append(
            {
                "text": row["text"],
                "author": celeb["name"],
                "sourceUrl": source_url,
                "score": row["score"],
            }
        )
    return results


def generate_puzzles(all_tweets: dict[str, list], count: int = 30) -> list[dict]:
    """Generate puzzle sets from scored tweets."""
    celeb_names = list(all_tweets.keys())
    celeb_lookup = {c["name"]: c for c in CELEBRITIES}

    puzzles = []
    used_tweets: set[str] = set()

    for puzzle_id in range(1, count + 1):
        # Pick 4 random celebrities for this puzzle
        if len(celeb_names) < 4:
            print(f"Not enough celebrities with tweets, stopping at {puzzle_id - 1}")
            break

        candidates = random.sample(celeb_names, 4)

        # Pick 3 tweets (one per round), each from a different candidate
        round_authors = random.sample(candidates, 3)
        rounds = []
        valid = True

        for author in round_authors:
            pool = [
                t for t in all_tweets[author] if t["text"] not in used_tweets
            ]
            if not pool:
                valid = False
                break
            tweet = pool[0]
            all_tweets[author].remove(tweet)
            used_tweets.add(tweet["text"])
            rounds.append(
                {
                    "text": tweet["text"],
                    "author": author,
                    "sourceUrl": tweet["sourceUrl"],
                }
            )

        if not valid:
            continue

        puzzle = {
            "id": puzzle_id,
            "candidates": [
                {
                    "name": name,
                    "handle": celeb_lookup[name]["handle"],
                }
                for name in candidates
            ],
            "rounds": rounds,
        }
        puzzles.append(puzzle)

    return puzzles


def main():
    parser = argparse.ArgumentParser(description="Generate Tweetle puzzles")
    parser.add_argument("--count", type=int, default=30, help="Number of puzzles")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    random.seed(args.seed)

    print("Loading and scoring tweets...")
    all_tweets: dict[str, list] = {}
    for celeb in CELEBRITIES:
        tweets = get_top_tweets(celeb, n=150)
        if tweets:
            all_tweets[celeb["name"]] = tweets
            print(f"    → {celeb['name']}: {len(tweets)} candidate tweets")
        else:
            print(f"    → {celeb['name']}: NO DATA")

    print(f"\nGenerating {args.count} puzzles...")
    puzzles = generate_puzzles(all_tweets, count=args.count)

    # Remove internal scores before saving
    for p in puzzles:
        for r in p["rounds"]:
            r.pop("score", None)

    print(f"Generated {len(puzzles)} puzzles")

    # Save
    with open(OUTPUT_PATH, "w") as f:
        json.dump(puzzles, f, indent=2, ensure_ascii=False)

    print(f"Saved to {OUTPUT_PATH}")

    # Print a sample
    if puzzles:
        print(f"\n--- Sample Puzzle #{puzzles[0]['id']} ---")
        p = puzzles[0]
        print(f"Candidates: {', '.join(c['name'] for c in p['candidates'])}")
        for i, r in enumerate(p["rounds"], 1):
            print(f"  Round {i}: \"{r['text'][:80]}...\"")
            print(f"           Answer: {r['author']}")
            if r["sourceUrl"]:
                print(f"           Link: {r['sourceUrl']}")


if __name__ == "__main__":
    main()
