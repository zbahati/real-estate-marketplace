# TASK: Build Listing Details Screen (React Native + Expo Router)

## 🎯 OBJECTIVE

Create a **premium Listing Details screen** that displays full property information with a modern, clean, mobile-first UI.

The screen must follow the design system strictly and feel like a production-ready app (Airbnb-style).

---

## 📍 FILE LOCATION

Create file:
app/listings/[id].tsx

---

## 🔗 DATA SOURCE

Use API:

GET /listings/:id

Response includes:

* title
* description
* price
* currency
* category
* listing_type
* images[]
* location (optional)
* distance (optional)

---

## 🎨 DESIGN SYSTEM (MANDATORY)

Follow:

Colors:

* primary: #2563EB
* background: #F9FAFB
* card: #FFFFFF
* textPrimary: #111827
* textSecondary: #6B7280
* border: #E5E7EB

Spacing:

* sm: 8
* md: 16
* lg: 24

Radius:

* md: 12
* lg: 16

---

## 🧱 UI STRUCTURE

### 1. IMAGE SECTION (TOP)

* Full width image
* Height: 250–300px
* Use first image from images[]
* If multiple images → allow horizontal swipe (FlatList horizontal)
* Rounded bottom corners

Overlay:

* Back button (top left)
* Favorite icon (top right)

---

### 2. PRICE + TITLE

Card style:

* Price (BIG, bold)
* Title below
* Category badge (house/car/land)
* Listing type badge (rent/sale)

Example:
[ RWF 80,000 ]
Lake Kivu House
[House] [Rent]

---

### 3. LOCATION + DISTANCE

* Show city/country if available
* Show distance if exists:
  "📍 2.3 km away"

---

### 4. DESCRIPTION

* Section title: "Description"
* Body text (readable spacing)

---

### 5. ACTION SECTION (IMPORTANT UX)

Sticky bottom bar:

* Primary button: "Contact Owner"
* Secondary button: "Send Request"

Design:

* Button color: primary (#2563EB)
* Rounded corners
* Full width

---

### 6. WHATSAPP INTEGRATION (IF AVAILABLE)

If phone exists:

Open:
https://wa.me/{phone}?text=Hello, I am interested in your listing

---

## ⚡ UX RULES

* Must be fast (no heavy components)
* Image-first design
* Minimal text clutter
* Clear call-to-action
* Smooth scrolling
* Touch-friendly spacing

---

## 🧠 BEHAVIOR

* Show loading state (ActivityIndicator)
* Handle empty images (placeholder)
* Handle errors gracefully

---

## 🧩 OPTIONAL (BONUS)

* Image carousel indicator (dots)
* Share button
* Favorite toggle

---

## 🚫 DO NOT

* Do not overload screen
* Do not break spacing system
* Do not use random colors
* Do not use inconsistent fonts

---

## ✅ SUCCESS CRITERIA

* Clean modern UI
* Works on mobile smoothly
* Images display correctly
* Actions are visible and usable
* Matches design system 100%

---

## 🔥 FINAL GOAL

This screen should look like:
→ Airbnb / Property24 / Booking style

This is the **most important screen in the app**
