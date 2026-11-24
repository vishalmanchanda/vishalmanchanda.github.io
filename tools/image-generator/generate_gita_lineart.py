#!/usr/bin/env python3
"""
Bhagavad Gita 9:16 Minimalist Line Art Image Generator
======================================================
Automated pipeline to generate elegant, minimalist black-and-white vector line art
images of Lord Krishna and warrior Arjuna in 9:16 vertical aspect ratio for each shloka
of the Bhagavad Gita.

Architecture:
  1. Verse Fetcher: Loads Sanskrit text, Hindi & English meanings for any/all 700 verses.
  2. AI Text Model (Art Director): Analyzes shloka philosophical context & crafts
     specialized minimal line-art scene prompts.
  3. AI Image Model: Generates 9:16 vertical artwork using Google Imagen 3 or OpenAI DALL-E 3.
  4. Auto Saver: Writes to assets/content/images/shrimad-bhagwad-gita/<chapter>-<verse>.jpg
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
import urllib.error
import base64
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_OUTPUT_DIR = REPO_ROOT / "assets" / "content" / "images" / "shrimad-bhagwad-gita"
DATA_CACHE_FILE = SCRIPT_DIR / "bhagavad_gita_all_verses.json"

# Style Signature for exquisite continuous vector line art (9:16 vertical, Strictly No Text)
STYLE_PREFIX = (
    "Exquisite minimalist clean black vector line art illustration, continuous contour line drawing, "
    "pure visual imagery with zero text, 9:16 vertical portrait composition. "
)

STYLE_SUFFIX = (
    ", pure visual artwork only, strictly no text, no words, no letters, no script, no characters, no labels, no subtitles, no typography, no captions, no quotes, no watermarks, "
    "beautifully drawn crisp solid black ink outlines with deep spiritual and contextual nuance, "
    "pure stark solid white background, zero shading, no hatching, no halftone, no colors, no gradients, "
    "elegant artistic silhouette, coloring book vector line art style."
)

# Visual motifs dictionary for Bhagavad Gita narrative themes (Prioritizing concept/teaching as hero)
THEMATIC_SCENES = {
    # Ch 1: Arjuna Vishada Yoga (Battlefield scene depiction & despair)
    1: "Battlefield scene depiction: Sanjaya narrating the vast Kurukshetra battlefield panorama with two immense opposing armies facing each other, and warrior Arjuna sitting despondent on the chariot floor laying down his Gandiva bow beside Lord Krishna",
    # Ch 2: Sankhya Yoga (Eternal Soul & Equanimity)
    2: "The eternal indestructible soul (Atman) shining as an unblemished luminous sphere untouched by fire, water, or wind as the primary hero subject, with Lord Krishna counseling warrior Arjuna weaved in an elegant circular inset medallion in the upper corner",
    # Ch 3: Karma Yoga (Sacrifice & Selfless Duty)
    3: "The sacred Vedic yajna fire altar rising into nourishing rain clouds that shower crops on earth as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner inset medallion",
    # Ch 4: Jnana Karma Sannyasa Yoga (Avatar & Flame of Knowledge)
    4: "The blazing sacrificial fire of spiritual knowledge (Jnana Agni) consuming dry logs of past karma into pure white ash as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper inset",
    # Ch 5: Karma Sannyasa Yoga (Lotus in Water)
    5: "A pristine sacred lotus blossom blooming pure and untouched above rippling water as water droplets slide harmlessly off its petals as the primary hero subject, with Lord Krishna counseling warrior Arjuna weaved in an upper corner inset",
    # Ch 6: Dhyana Yoga (Meditation & The Chariot of Mind)
    6: "A sacred oil lamp burning with an unflickering straight flame in a windless shelter alongside a yogi in steady lotus meditation as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette",
    # Ch 7: Jnana Vijnana Yoga (Seven Elements & Divine Energy)
    7: "The five cosmic elements (earth, water, fire, air, space) converging in harmonious sacred geometry as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular medallion",
    # Ch 8: Akshara Brahma Yoga (The Eternal Spirit)
    8: "The sacred syllable Om (ॐ) radiating celestial orbits with an ascending soul reaching the supreme realm as the primary hero subject, with Lord Krishna counseling warrior Arjuna weaved in an upper inset",
    # Ch 9: Raja Vidya Yoga (Supreme Secret & Pure Offering)
    9: "Cupped hands offering a single leaf, a fresh flower, a fruit, and water in pure love as the primary hero subject, with Lord Krishna receiving the offering in divine grace and warrior Arjuna in prayer",
    # Ch 10: Vibhuti Yoga (Divine Splendors)
    10: "Divine celestial splendors: a radiant sun, a majestic roaring lion, and flowing sacred river Ganga as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in a circular inset",
    # Ch 11: Vishwaroopa Darshana Yoga (The Cosmic Universal Form)
    11: "Full dramatic scene: The awe-inspiring cosmic universal form (Vishwaroopa) of Lord Krishna with radiating concentric mandalas, celestial crowns, suns, and galaxies, while warrior Arjuna kneels with palms pressed together in breathless wonder",
    # Ch 12: Bhakti Yoga (Path of Loving Devotion)
    12: "A serene heart glowing with divine devotion surrounded by blooming lotus flowers as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an elegant upper inset",
    # Ch 13: Kshetra Kshetrajna Yoga (Field and Knower of Field)
    13: "The human body depicted as a sacred field (Kshetra) with the luminous inner soul (Kshetrajna) shining as the unattached witness at its center as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper inset",
    # Ch 14: Gunatraya Vibhaga Yoga (The Three Gunas)
    14: "The three braided cords of nature (Sattva, Rajas, Tamas) with the liberated soul ascending peacefully above them as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper vignette",
    # Ch 15: Purushottama Yoga (The Upside-Down Cosmic Tree)
    15: "The mystical inverted cosmic Ashvattha banyan tree with roots reaching into celestial realms and branches spreading down toward earth as the primary hero subject, severed cleanly by the axe of detachment, with Lord Krishna and warrior Arjuna weaved in an upper corner inset",
    # Ch 16: Daivasura Sampad Yoga (Divine vs Demonic Qualities)
    16: "A radiant glowing lotus of divine virtues contrasting with the entangled thorny branches of demonic pride as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular medallion",
    # Ch 17: Shraddhatraya Vibhaga Yoga (The Threefold Faith)
    17: "The sacred syllables 'Om Tat Sat' drawn in elegant divine calligraphy above an altar of selfless service as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper inset",
    # Ch 18: Moksha Sannyasa Yoga (Surrender & Triumph)
    18: "Full dramatic scene: Warrior Arjuna standing tall with renewed valor on the chariot, holding his Gandiva bow aloft with firm conviction, standing alongside Lord Krishna with chariot reins in hand"
}

# Specific famous verse visual anchors prioritizing concept as hero
FAMOUS_VERSES = {
    "2.47": "Reverent noble cupped hands planting seeds into fertile soil and releasing ripe grains and fruits without clutching them as the primary hero subject, symbolizing Nishkama Karma (duty performed without attachment to results), with Lord Krishna counseling warrior Arjuna creatively weaved in an elegant circular inset medallion in the upper corner",
    "2.20": "The eternal indestructible soul (Atman) shining as an unblemished luminous sphere within the heart as the primary hero subject, birthless, changeless, and deathless, with Lord Krishna counseling warrior Arjuna weaved in an upper corner medallion",
    "4.7": "Full dramatic scene: Lord Krishna manifesting in divine poise to protect righteousness (Dharma), standing in serene grace with peacock feather crown, rays of protection emanating gently",
    "6.19": "A sacred oil lamp (diya) burning with an utterly motionless, unflickering straight flame in a windless shelter as the primary central hero subject, with a serene yogi in padmasana meditation, and Lord Krishna counseling warrior Arjuna weaved in an upper corner vignette",
    "9.26": "Noble cupped hands offering a single fresh leaf, a blooming flower, a fruit, and water in heartfelt devotion as the central hero subject, with Lord Krishna receiving the offering in divine grace and warrior Arjuna in prayer",
    "11.15": "Full dramatic scene: Warrior Arjuna trembling with palms pressed together in awe before the majestic cosmic universal form (Vishwaroopam) displaying multiple divine crowns and celestial rays in clean vector lines",
    "18.66": "Full dramatic scene: Warrior Arjuna with folded hands prostrating in total surrender at the lotus feet of Lord Krishna, who raises His right hand in the supreme Abhaya Mudra offering universal refuge"
}


# ==============================================================================
# 1. VERSE DATA FETCHER
# ==============================================================================

def fetch_shloka_data(chapter: int, verse: int) -> dict:
    """Fetch shloka metadata (Sanskrit, transliteration, Hindi, English)."""
    url = f"https://vedicscriptures.github.io/slok/{chapter}/{verse}"
    headers = {"User-Agent": "Mozilla/5.0 (Scripture-LineArt-Studio/2.0)"}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            sanskrit = data.get("slok", "").strip()
            hindi = ""
            if "tej" in data and isinstance(data["tej"], dict):
                hindi = data["tej"].get("ht", "").strip()
            english = ""
            for key in ["siva", "purohit", "chinmay", "san"]:
                if key in data and isinstance(data[key], dict) and data[key].get("et"):
                    english = data[key]["et"].strip()
                    break

            return {
                "chapter": chapter,
                "verse": verse,
                "title": f"{chapter}.{verse}",
                "sanskrit": sanskrit,
                "hindi": hindi,
                "english": english,
                "transliteration": data.get("transliteration", "")
            }
    except Exception as e:
        print(f"  [Notice] API lookup for {chapter}.{verse} had issue ({e}). Using catalog fallback.")
        return {
            "chapter": chapter,
            "verse": verse,
            "title": f"{chapter}.{verse}",
            "sanskrit": f"Bhagavad Gita Chapter {chapter}, Verse {verse}",
            "hindi": "",
            "english": f"Dialogue between Lord Krishna and warrior Arjuna in Chapter {chapter}, Verse {verse}.",
            "transliteration": ""
        }


# ==============================================================================
# 2. AI TEXT GENERATION MODEL (ART DIRECTOR / PROMPT SYNTHESIZER)
# ==============================================================================

def extract_clean_meaning(text: str) -> str:
    """Strip 'Word meanings:' prefix and convert dictionary format to clean human concepts."""
    if not text:
        return ""
    import re
    clean = re.sub(r"^word\s*meanings?:?\s*", "", str(text), flags=re.IGNORECASE)
    if "—" in clean:
        parts = []
        for part in clean.split(";"):
            sub = part.split("—")
            m = sub[1].strip() if len(sub) > 1 else sub[0].strip()
            if m and "uvācha" not in m.lower() and "said" not in m.lower():
                parts.append(m)
        clean = ", ".join(parts)
    return re.sub(r"\s+", " ", clean).strip()


def get_thematic_verse_scene(shloka: dict) -> str:
    """
    Detailed situation-specific visual scene director:
    Prioritizes the philosophical teaching/metaphor as the primary visual hero (70-80% of canvas).
    Lord Krishna and warrior Arjuna are creatively weaved in an elegant inset vignette or foreground.
    Full Krishna-Arjuna view is reserved for emotional dialogue, command, or prayer.
    Scene depiction is primary for Sanjaya's narration or battlefield views.
    """
    ch = int(shloka.get("chapter", 2))
    v = int(shloka.get("verse", 1))
    eng = (shloka.get("english", "") or "").lower()
    sanskrit = (shloka.get("sanskrit", "") or "").lower()

    # 1. Chapter 2: Granular Verse Situations
    if ch == 2:
        # 2.1 - 2.5: Direct dramatic interaction & grief (Full dramatic view)
        if v == 1:
            return "Full dramatic scene: Warrior Arjuna collapsed on the chariot floor in deep grief, head buried in his trembling hands, famed Gandiva bow and quiver fallen on the ground, eyes full of tears, while Lord Krishna looks upon him with profound divine compassion"
        if v == 2:
            return "Full dramatic scene: Lord Krishna standing tall in divine majesty, arm outstretched pointing forward like a lightning bolt, sternly rebuking warrior Arjuna to cast off shameful dejection"
        if v == 3:
            return "Full dramatic scene: Lord Krishna with right hand raised high in commanding inspiration, urging warrior Arjuna to arise and conquer unmanly weakness, while Arjuna slowly begins to lift his head in resolve"
        if v == 4:
            return "Full dramatic scene: Warrior Arjuna bowing with folded hands in sorrowful dilemma before Lord Krishna, gesturing toward distant noble silhouettes of his revered elders Bhishma and Drona"
        if v == 5:
            return "Full dramatic scene: Warrior Arjuna in solemn contemplation beside Lord Krishna on the chariot, reflecting upon choosing simple alms over kingdoms tainted with the blood of revered teachers"
        if v in (6, 7):
            return "Full dramatic scene: Warrior Arjuna kneeling before Lord Krishna with joined palms in humble surrender, declaring himself Krishna's disciple and pleading for guidance in moral paralysis"
        if v in (8, 9):
            return 'Full dramatic scene: Warrior Arjuna speaking with trembling sorrow to Lord Krishna, declaring "I shall not fight", collapsing silent onto the chariot seat as Krishna listens with an all-knowing serene smile'
        if v == 10:
            return "Full dramatic scene: Lord Krishna, with a compassionate half-smile playing upon His lips, standing between the two armies prepared to speak the nectar of immortal wisdom to the grieving Arjuna"

        # 2.11 - 2.30: The Eternal Soul (Atman) vs Mortal Body (Teaching is Primary Hero)
        if v == 11:
            return "The turning cosmic wheel of time with crescent moon and radiant sun as the primary hero subject, illustrating that the wise grieve neither for the living nor the dead, with Lord Krishna and warrior Arjuna weaved in an upper circular inset vignette"
        if v == 12:
            return "A timeless panoramic horizon connecting past, present, and future epochs as the primary hero subject, illustrating that life has never ceased to exist, with Lord Krishna counseling warrior Arjuna weaved in a lower corner inset medallion"
        if v == 13:
            return "The continuous human journey showing the soul passing gracefully through childhood, youth, and frail old age into a new dawn as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular inset vignette"
        if v == 14:
            return "A noble resolute figure standing unshakable amidst contrasting swirling symbols of scorching summer sun and icy winter frost, pleasure and pain, as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner medallion"
        if v == 15:
            return "An enlightened calm sage walking serenely through fluctuating storms of joy and sorrow without stumbling as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette"
        if v == 16:
            return "The radiant piercing light of eternal truth (Sat) piercing through and dissolving shadowy transient illusions (Asat) as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an elegant top inset vignette"
        if v == 17:
            return "An all-pervading celestial radiance sustaining all creation, completely indestructible and eternal as the primary hero subject, with Lord Krishna counseling warrior Arjuna weaved in a subtle lower corner inset"
        if v in (18, 19):
            return "A luminous eternal soul untouched while transient physical armor crumbles into dust as the primary hero subject, illustrating that the soul neither slays nor is slain, with Lord Krishna and warrior Arjuna weaved in an upper corner inset"
        if v == 20:
            return "The immortal soul (Atman) shining as an unblemished luminous sphere within the heart as the primary hero subject, birthless, changeless, and deathless, with Lord Krishna counseling warrior Arjuna weaved in an upper circular inset medallion"
        if v == 21:
            return "The eternal indestructible spirit resting in timeless stillness above the realm of mortal weapons and battles as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an elegant circular vignette"
        if v == 22:
            return "A soul gracefully shedding worn, ragged garments onto the ground and stepping forward into fresh radiant luminous robes as the primary hero subject, with Lord Krishna and warrior Arjuna creatively weaved in an elegant circular inset medallion in the upper corner"
        if v == 23:
            return "The indestructible soul as an impenetrable radiant sphere at the center, surrounded by a sharp sword unable to cut it, blazing fire unable to burn it, surging ocean water unable to wet it, and rushing wind unable to dry it as the primary hero subject, with Lord Krishna and warrior Arjuna creatively weaved in an elegant lower inset vignette"
        if v == 24:
            return "The all-pervading, immovable, primeval light of the soul standing firm like an eternal mountain amidst swirling winds as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette"
        if v == 25:
            return "The unmanifest, inconceivable, and immutable essence of the pure soul radiating quiet light beyond sensory reach as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in a corner medallion"
        if 26 <= v <= 30:
            return "The wonder of the soul (Ashcharyavat) depicted as an awe-inspiring jewel of divine consciousness in the cosmos as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular inset medallion"

        # 2.31 - 2.38: Kshatriya Duty & Honor
        if 31 <= v <= 38:
            return "A noble Kshatriya warrior stepping forward with raised standard toward open celestial gates of righteous duty without fear of loss as the central hero subject, with Lord Krishna counseling warrior Arjuna weaved in an upper inset vignette"

        # 2.39 - 2.53: Buddhi Yoga & Nishkama Karma (Action without Attachment)
        if v == 47:
            return "Reverent noble cupped hands planting seeds into fertile soil and releasing ripe grains and fruits without clutching them as the primary hero subject, symbolizing Nishkama Karma (duty without attachment to fruits), with Lord Krishna counseling warrior Arjuna weaved in an elegant circular inset medallion in the upper corner"
        if v == 48:
            return "Balanced celestial scales in perfect motionless equilibrium between victory and defeat, gain and loss as the primary hero subject, symbolizing equanimity (Samatvam), with Lord Krishna and warrior Arjuna weaved in an upper corner inset medallion"
        if v in (49, 50):
            return "The luminous chariot of resolute intellect (Buddhi) riding smoothly above muddy pits of petty desires and reward-seeking as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper vignette"
        if v in (51, 52, 53):
            return "A clear intellect emerging like a blooming white flower out of the dense fog of delusion into tranquil stillness as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette"

        # 2.54 - 2.72: Sthitaprajna (The Sage of Steady Wisdom)
        if v == 54:
            return "Full dramatic scene: Warrior Arjuna asking Lord Krishna with joined hands to describe the signs, speech, sitting, and walking of a sage established in steady wisdom (Sthitaprajna)"
        if v in (55, 56, 57):
            return "A tranquil sage in serene meditation, resting completely contented in the Self alone, free from craving, fear, and anger as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner inset medallion"
        if v == 58:
            return "A wise majestic tortoise gracefully withdrawing its head and all four limbs completely inside its solid protective shell as the primary hero subject, symbolizing mastery over the senses, with Lord Krishna and warrior Arjuna creatively weaved in an elegant circular inset medallion in the upper corner"
        if v in (59, 60, 61):
            return "Spirited wild horses being steadily brought under control by firm gentle reins of mindful awareness as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette"
        if v in (62, 63):
            return "A downward cascading spiral of the mind: sensory contemplation sparking burning desire, turning into wrath, clouding the intellect into complete delusion as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner vignette"
        if v in (64, 65, 66):
            return "A tranquil mind shining like a pure crystal lake reflecting the clear sky, experiencing profound peace free from attraction and aversion as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette"
        if v == 67:
            return "A fragile wooden sailboat violently tossed across turbulent ocean storm waves by wild gusting winds as the primary hero subject, illustrating wandering senses sweeping away intellect, with Lord Krishna and warrior Arjuna creatively weaved in an upper sky inset observing the tempest"
        if v == 68:
            return "A noble fortress of the mind with all gates guarded against unruly impulses as the central hero subject, with Lord Krishna and warrior Arjuna weaved in an upper corner medallion"
        if v == 69:
            return "A peaceful sage meditating beneath a serene starry night sky while the material city sleeps below as the primary hero subject, symbolizing spiritual vigilance, with Lord Krishna and warrior Arjuna weaved in an upper inset"
        if v == 70:
            return "A vast tranquil ocean absorbing cascading rushing waterfalls and torrential rivers pouring from rocky cliffs without overflowing its shores as the primary hero subject, with Lord Krishna and warrior Arjuna weaved as subtle contemplative silhouettes in the lower foreground"
        if v in (71, 72):
            return "The serene attainment of Brahmanirvana (supreme divine peace), depicted by a luminous aura of freedom shedding all egoism and possessiveness as the primary hero subject, with Lord Krishna and warrior Arjuna weaved in an upper circular vignette"

    # 2. Chapter 1: Battlefield & Despair (Scene Depiction Primary)
    if ch == 1:
        if v <= 11:
            return "Battlefield scene depiction: Sanjaya narrating the vast Kurukshetra battlefield panorama to King Dhritarashtra, showing two immense opposing armies aligned with battle flags, chariots, and silhouetted spearheads against the morning sky"
        if 12 <= v <= 19:
            return "Battlefield scene depiction: Bhishma sounding his roaring conch, and Lord Krishna blowing the divine conch shell Panchajanya alongside warrior Arjuna blowing Devadatta, sending radiating concentric soundwave lines across the sky and earth"
        if 20 <= v <= 27:
            return "Battlefield scene depiction: The royal golden war chariot drawn by four white horses positioned in the neutral open expanse squarely between the two assembled battle lines, as Arjuna surveys kinsmen"
        if v >= 28:
            return "Full dramatic scene: Warrior Arjuna lowering his Gandiva bow in overwhelming anguish, knees trembling, collapsing onto the chariot floor beside Lord Krishna with tear-stained eyes"

    # 3. Keyword / Concept Allegory Matching for Other Chapters
    if "tortoise" in eng or "kurma" in sanskrit:
        return "A wise tortoise gracefully withdrawing its head and four limbs inside its solid protective shell as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an elegant circular inset medallion"
    if "boat" in eng or "ship" in eng or "navam" in sanskrit:
        return "A fragile wooden boat tossed on stormy turbulent waves by wild gale winds as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper sky inset medallion"
    if "ocean" in eng or "sea" in eng or "samudra" in sanskrit:
        return "A vast tranquil ocean absorbing cascading rushing rivers without overflowing as the central hero visual, with Lord Krishna and warrior Arjuna weaved as contemplative silhouettes in the lower foreground"
    if "lamp" in eng or "flame" in eng or "dipa" in sanskrit:
        return "A sacred oil lamp burning with an unflickering straight flame in a windless alcove as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an upper corner inset"
    if "garment" in eng or "clothes" in eng or "vasamsi" in sanskrit:
        return "A soul shedding old tattered garments on the ground and donning fresh radiant luminous robes as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper circular inset"
    if "sword" in eng or "weapon" in eng or "shastra" in sanskrit or "khadga" in sanskrit:
        return "The luminous sword of spiritual wisdom (Jnana Khadga) cleanly severing dense knots of doubt within the heart as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper vignette"
    if "fire" in eng or "flame" in eng or "agni" in sanskrit or "vahni" in sanskrit:
        return "Sacred blazing sacrificial fire consuming dry wood of past karma into pure white ashes as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper corner inset"
    if "tree" in eng or "ashvattha" in sanskrit or "vriksha" in sanskrit:
        return "The mystical inverted Ashvattha banyan tree with roots reaching into celestial realms and branches spreading below as the central hero visual, cut by the axe of detachment, with Lord Krishna and warrior Arjuna weaved in a circular inset vignette"
    if "lotus" in eng or "padma" in sanskrit:
        return "A pristine sacred lotus blossom blooming above water with glistening droplets rolling off untouched as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an upper inset"
    if "cosmic" in eng or "universal" in eng or "vishwaroop" in sanskrit or ch == 11:
        return "Full dramatic scene: The awe-inspiring cosmic universal form (Vishwaroopa) of Lord Krishna with radiating mandalas, celestial crowns, suns, and galaxies, with warrior Arjuna kneeling in breathtaking wonder"
    if "devotion" in eng or "offering" in eng or "patram" in sanskrit or "bhakti" in sanskrit:
        return "Noble cupped hands offering a fresh leaf, a blooming flower, a fruit, and pure water in heartfelt devotion as the central hero visual, with Lord Krishna receiving the offering in divine grace and warrior Arjuna in prayer"
    if "sacrifice" in eng or "yajna" in sanskrit:
        return "The sacred wheel of Vedic sacrifice with holy fire altar smoke rising into rain clouds nourishing crops on earth as the central hero visual, with Lord Krishna and warrior Arjuna weaved in an upper inset"
    if "meditation" in eng or "yogi" in eng or "dhyana" in sanskrit or "yoga" in sanskrit:
        return "A serene yogi seated in steady lotus posture beneath a sacred banyan tree, spine erect, hands in Dhyana Mudra as the central hero visual, with Lord Krishna counseling warrior Arjuna weaved in an upper circular vignette"

    # 4. Default: Concept as primary hero with Krishna & Arjuna in inset (STRICTLY NO TEXT)
    import re
    clean_summary = extract_clean_meaning(shloka.get("english", "") or "")
    clean_summary = clean_summary[:95].replace('"', '').replace('—', ', ').replace(';', ', ')
    if not clean_summary or len(clean_summary) < 5:
        clean_summary = f"divine wisdom and righteous duty in Chapter {ch}, Verse {v}"
    return f'The spiritual teaching of "{clean_summary}" depicted as the primary visual hero without any text or written words, with Lord Krishna counseling warrior Arjuna creatively weaved in an elegant circular inset vignette'


def synthesize_lineart_prompt_ai(
    shloka: dict,
    gemini_api_key: str = None,
    openai_api_key: str = None,
    text_model: str = "gemini-3.1-flash-lite"
) -> str:
    """
    Uses Gemini (or OpenAI) to analyze the shloka and craft a visual scene description.
    Enforces visual hierarchy: teaching/metaphor as hero (70-80%), Krishna & Arjuna weaved in inset,
    full view only for emotional exchange, and battlefield panorama for Sanjaya narration.
    Strictly forbids text, words, word meanings, labels, and typography in the artwork.
    """
    import re
    ch = shloka["chapter"]
    v = shloka["verse"]
    ch_v = f"{ch}.{v}"

    # Check famous verses override
    if ch_v in FAMOUS_VERSES:
        scene = FAMOUS_VERSES[ch_v]
        return f"{STYLE_PREFIX}{scene}{STYLE_SUFFIX}"

    # Prompt instructions for LLM (Situation-Specific Art Director)
    system_instruction = (
        "You are a visionary Vedic art director for a prestigious Bhagavad Gita art gallery "
        "rendered in MINIMALIST, CONTINUOUS BLACK AND WHITE VECTOR LINE ART (coloring-book contour style).\n"
        "YOUR MISSION: Conceive a completely UNIQUE, DISTINCT visual composition specifically "
        "derived from the philosophical teaching, scene narration, or emotional exchange of THIS individual verse.\n\n"
        "CRITICAL VISUAL HIERARCHY & TEXT CONSTRAINTS:\n"
        "1. STRICTLY PURE VISUALS ONLY — ZERO TEXT:\n"
        "   - ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO SCRIPT, NO WORD MEANINGS, NO TRANSLITERATION, NO LABELS, NO WATERMARKS, NO CAPTIONS, NO SUBTITLES, NO CALLIGRAPHY, NO BANNERS.\n"
        "   - The output illustration must be 100% PURE VISUAL LINE ART. Do not describe or include any written words or word meanings in the scene. Every spiritual concept must be expressed purely through visual symbols, gestures, scenery, and objects.\n"
        "2. THE TEACHING / CONCEPT / METAPHOR MUST BE THE PRIMARY HERO (70–80% of canvas):\n"
        "   - Whenever the verse expounds a philosophical principle, allegory, or metaphor (e.g. Tortoise withdrawing limbs 2.58, boat in a storm 2.67, soul changing clothes 2.22, indestructible soul 2.23, lamp in windless shelter 6.19, ocean absorbing rivers 2.70, lotus untouched by water 5.10, noble hands releasing seeds 2.47, inverted cosmic tree 15.1, senses as galloping horses, etc.):\n"
        "   - THE PICTORIAL METAPHOR/CONCEPT MUST BE THE CENTRAL, DOMINANT HERO VISUAL (occupying 70–80% of the composition).\n"
        "   - CREATIVELY WEAVE Lord Krishna and warrior Arjuna into an ELEGANT CIRCULAR INSET VIGNETTE (corner medallion or subtle foreground observant silhouettes where Krishna gestures toward the vision and Arjuna contemplates), so that the teaching/concept does NOT take a back seat!\n"
        "3. FULL DRAMATIC VIEW OF KRISHNA & ARJUNA ONLY WHEN INTERACTION-DRIVEN:\n"
        "   - When the verse depicts direct emotional crisis, personal confrontation, command, prayer, or surrender (e.g. 2.1 Arjuna weeping collapsed on the chariot floor; 2.2–2.3 Krishna standing tall, pointing finger, sternly rebuking and commanding Arjuna to arise; 2.4 Arjuna pleading about Bhishma and Drona; 11.15 Arjuna trembling before Vishwaroopa; 18.66 total surrender).\n"
        "   - In these verses, depict Lord Krishna (with peacock feather crown, divine serenity) and warrior Arjuna (with Kshatriya armor, bow) in full dynamic dramatic view.\n"
        "4. SCENE DEPICTION PRIMARY FOR SANJAYA / BATTLEFIELD NARRATION:\n"
        "   - When Sanjaya is speaking or in Chapter 1 battlefield descriptions (e.g. The two vast armies facing each other, conch shells blowing with radiating sonic lines, chariot stationed between the two armies in neutral ground).\n"
        "5. CHARACTERS:\n"
        "   - When Lord Krishna and warrior Arjuna are depicted (whether full view or in an inset vignette), explicitly name them with great dignity and contextual depth. DO NOT specify faceless or blank figures.\n"
        "6. STYLE CONSTRAINTS:\n"
        "   - Clean, uncluttered 9:16 vertical portrait composition.\n"
        "   - Solid continuous black ink vector outlines on pure stark solid white background. Zero shading, zero hatching, zero colors, zero gradients.\n\n"
        "OUTPUT FORMAT: Output ONLY a 35 to 55 word precise visual scene description in English for the line artist. Strictly visuals only, no text/labels, no preamble, no quotes."
    )

    cleaned_meaning = extract_clean_meaning(shloka.get("english", "") or "")
    user_content = (
        f"Bhagavad Gita Chapter {ch}, Verse {v}\n"
        f"Sanskrit: {shloka.get('sanskrit', '')}\n"
        f"Philosophical Theme: {cleaned_meaning or 'Spiritual dialogue between Lord Krishna and warrior Arjuna'}\n\n"
        "Craft the unique visual line art scene for this verse (STRICTLY PURE VISUALS ONLY — NO WORDS/TEXT/MEANINGS):"
    )

    # 1. Try Gemini Text API (gemini-3.1-flash-lite with candidate fallback)
    if gemini_api_key:
        candidate_models = [
            text_model,
            "gemini-3.1-flash-lite",
            "gemini-3.1-flash-lite-preview",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ]
        # Preserve unique order
        seen = set()
        unique_models = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

        for model in unique_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_api_key}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": f"{system_instruction}\n\n{user_content}"}]
                        }
                    ],
                    "generationConfig": {
                        "temperature": 0.75,
                        "maxOutputTokens": 120
                    }
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=12) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    candidates = res_data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and parts[0].get("text"):
                            scene = parts[0]["text"].strip().replace("\n", " ").replace('"', '')
                            scene = re.sub(r"\b(word\s*meanings?|written\s*words?|inscribed\s*text|text\s*labels?|captions?|subtitles?)\b", "symbolic visual imagery", scene, flags=re.IGNORECASE)
                            return f"{STYLE_PREFIX}{scene}{STYLE_SUFFIX}"
            except Exception as err:
                # Try next model candidate
                pass

    # 2. Try OpenAI Text API if key available
    if openai_api_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ],
                "temperature": 0.75,
                "max_tokens": 120
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {openai_api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                scene = res_data["choices"][0]["message"]["content"].strip().replace("\n", " ").replace('"', '')
                scene = re.sub(r"\b(word\s*meanings?|written\s*words?|inscribed\s*text|text\s*labels?|captions?|subtitles?)\b", "symbolic visual imagery", scene, flags=re.IGNORECASE)
                return f"{STYLE_PREFIX}{scene}{STYLE_SUFFIX}"
        except Exception as err:
            pass

    # 3. Deterministic Situation-Specific Vedic Thematic Fallback
    scene = get_thematic_verse_scene(shloka)
    return f"{STYLE_PREFIX}{scene}{STYLE_SUFFIX}"


# ==============================================================================
# 3. AI IMAGE GENERATION (9:16 VERTICAL ASPECT RATIO)
# ==============================================================================

def generate_image_gemini(
    prompt: str,
    gemini_api_key: str,
    image_model: str = "gemini-3.1-flash-image"
) -> bytes:
    """Generate 9:16 image using Gemini Flash Image (with candidate fallbacks & Pollinations)."""
    candidate_models = [
        image_model,
        "gemini-3.1-flash-image",
        "gemini-3.1-flash-image-preview",
        "gemini-2.5-flash-image",
        "gemini-2.0-flash-exp"
    ]
    seen = set()
    unique_models = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    # 1. Try Gemini Flash Multimodal Image Generation
    for model in unique_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"Generate a 9:16 vertical orientation minimalist continuous contour line art illustration on stark pure white background: {prompt}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseModalities": ["TEXT", "IMAGE"],
                    "imageConfig": {
                        "aspectRatio": "9:16"
                    }
                }
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    for p in parts:
                        if "inlineData" in p and "data" in p["inlineData"]:
                            return base64.b64decode(p["inlineData"]["data"])
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            # Non-404 error, try next candidate
        except Exception:
            continue

    # 2. Try Imagen 3 predict if requested
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key={gemini_api_key}"
        payload = {
            "instances": [{"prompt": prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": "9:16",
                "outputOptions": {"mimeType": "image/jpeg"}
            }
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            predictions = data.get("predictions", [])
            if predictions and predictions[0].get("bytesBase64Encoded"):
                return base64.b64decode(predictions[0]["bytesBase64Encoded"])
    except Exception:
        pass

    # 3. Fallback to Pollinations AI (100% Free 9:16)
    print("  ⚠️ Gemini image endpoints unavailable. Falling back to Pollinations AI (9:16)...")
    return generate_image_pollinations_916(prompt)


def generate_image_pollinations_916(prompt: str) -> bytes:
    """Generate 9:16 vertical image using Pollinations AI (100% Free)."""
    import random
    seed = random.randint(1, 10000000)
    clean_p = urllib.parse.quote(prompt[:450])
    url = f"https://image.pollinations.ai/prompt/{clean_p}?width=576&height=1024&nologo=true&seed={seed}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
    with urllib.request.urlopen(req, timeout=45) as resp:
        return resp.read()


def generate_image_openai_dalle3(prompt: str, openai_api_key: str) -> bytes:
    """Generate 9:16 image using OpenAI DALL-E 3 (size 1024x1792)."""
    url = "https://api.openai.com/v1/images/generations"
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "size": "1024x1792",  # 9:16 vertical ratio
        "quality": "standard",
        "response_format": "b64_json",
        "n": 1
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openai_api_key}"
        }
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        b64_img = data["data"][0]["b64_json"]
        return base64.b64decode(b64_img)


# ==============================================================================
# 4. MAIN BATCH GENERATOR PIPELINE
# ==============================================================================

def process_verse(chapter: int, verse: int, args, gemini_key: str, openai_key: str):
    """Process a single verse: load data -> synthesize prompt -> generate 9:16 image -> save."""
    filename = f"{chapter}-{verse}.jpg"
    target_path = Path(args.output_dir) / filename

    print(f"\n=======================================================")
    print(f"📖 Verse {chapter}.{verse} -> Destination: {target_path.name}")
    print(f"=======================================================")

    if args.skip_existing and target_path.exists():
        print(f"  ⏭️ File '{filename}' already exists. Skipping.")
        return

    # 1. Fetch Verse Data
    shloka = fetch_shloka_data(chapter, verse)
    if shloka.get("sanskrit"):
        clean_sanskrit = shloka["sanskrit"].split("\n")[0]
        print(f"  🕉️ Sanskrit: {clean_sanskrit}")
    if shloka.get("english"):
        print(f"  📜 English: {shloka['english'][:100]}...")

    # 2. Synthesize Line Art Prompt (using AI text model if key provided)
    print("  🎨 Synthesizing 9:16 minimalist line-art prompt...")
    prompt = synthesize_lineart_prompt_ai(
        shloka,
        gemini_api_key=gemini_key,
        openai_api_key=openai_key,
        text_model=args.text_model
    )
    print(f"  ✍️ Prompt: {prompt[:140]}...")

    if args.dry_run:
        print("  [Dry Run] Image generation skipped.")
        return

    # 3. Generate 9:16 Image
    img_bytes = None
    provider = args.provider.lower()

    if provider == "gemini":
        if not gemini_key:
            raise ValueError("GEMINI_API_KEY is required for provider 'gemini'. Set env var or pass --gemini-key")
        print(f"  🔮 Generating 9:16 image via Gemini ({args.image_model} / candidate fallbacks)...")
        img_bytes = generate_image_gemini(prompt, gemini_key, image_model=args.image_model)
    elif provider == "pollinations":
        print("  🌸 Generating 9:16 image via Pollinations AI (100% Free)...")
        img_bytes = generate_image_pollinations_916(prompt)
    elif provider == "openai":
        if not openai_key:
            raise ValueError("OPENAI_API_KEY is required for provider 'openai'. Set env var or pass --openai-key")
        print("  🎨 Generating 9:16 image via OpenAI DALL-E 3 (1024x1792)...")
        img_bytes = generate_image_openai_dalle3(prompt, openai_key)
    else:
        raise ValueError(f"Unsupported provider: {provider}")

    # 4. Save to Repository
    os.makedirs(args.output_dir, exist_ok=True)
    with open(target_path, "wb") as f:
        f.write(img_bytes)

    size_kb = len(img_bytes) / 1024
    print(f"  ✅ Saved 9:16 image: {target_path} ({size_kb:.1f} KB)")


def main():
    parser = argparse.ArgumentParser(
        description="Generate 9:16 Minimalist Line Art images for Bhagavad Gita verses using AI."
    )
    parser.add_argument("--chapter", "-c", type=str, default="2", help="Chapter number (1-18) or 'all'")
    parser.add_argument("--verse", "-v", type=str, default="47", help="Verse number, range e.g. '1-10', or 'all'")
    parser.add_argument("--provider", "-p", type=str, default="gemini", choices=["gemini", "pollinations", "openai"], help="Image engine")
    parser.add_argument("--text-model", type=str, default="gemini-3.1-flash-lite", help="Gemini text model for prompt direction")
    parser.add_argument("--image-model", type=str, default="gemini-3.1-flash-image", help="Gemini multimodal image model (9:16)")
    parser.add_argument("--gemini-key", type=str, default=os.environ.get("GEMINI_API_KEY", ""), help="Gemini API Key")
    parser.add_argument("--openai-key", type=str, default=os.environ.get("OPENAI_API_KEY", ""), help="OpenAI API Key")
    parser.add_argument("--output-dir", "-o", type=str, default=str(DEFAULT_OUTPUT_DIR), help="Output folder")
    parser.add_argument("--skip-existing", action="store_true", default=True, help="Skip verses already saved on disk")
    parser.add_argument("--dry-run", action="store_true", help="Only synthesize prompts without generating images")
    parser.add_argument("--delay", type=float, default=2.0, help="Delay between verses in seconds")

    args = parser.parse_args()

    # Gita Chapter verse counts (1 through 18)
    CHAPTER_VERSE_COUNTS = [47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 34, 27, 20, 24, 28, 78]

    # Parse chapters
    if args.chapter.lower() == "all":
        chapters = list(range(1, 19))
    else:
        chapters = [int(args.chapter)]

    # Process all selected verses
    print("=========================================================")
    print("🕉️  Bhagavad Gita 9:16 Minimalist Line Art Studio Generator")
    print(f"📁 Output Directory: {args.output_dir}")
    print(f"🤖 Image Provider:   {args.provider.upper()}")
    print("=========================================================")

    for ch in chapters:
        max_v = CHAPTER_VERSE_COUNTS[ch - 1]

        if args.verse.lower() == "all":
            verses = list(range(1, max_v + 1))
        elif "-" in args.verse:
            start_v, end_v = map(int, args.verse.split("-"))
            verses = list(range(start_v, min(end_v, max_v) + 1))
        else:
            verses = [int(args.verse)]

        for v in verses:
            try:
                process_verse(ch, v, args, args.gemini_key, args.openai_key)
                if len(verses) > 1 and not args.dry_run:
                    time.sleep(args.delay)
            except Exception as e:
                print(f"  ❌ Error processing Verse {ch}.{v}: {e}")


if __name__ == "__main__":
    main()
