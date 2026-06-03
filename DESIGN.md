# Clash Royale Meta Deck Finder - Tasarım Kılavuzu (`DESIGN.md`)

Bu doküman, uygulamanın görsel standartlarını, koyu/açık mod renk paletini, tipografisini ve cam tasarımı (glassmorphism) kurallarını tanımlar. Tasarım, gözü yormayan asil e-spor analiz portalları estetiğine sahiptir.

---

## 1. Tasarım İlkeleri (Design Principles)

1.  **Maksimum Yalınlık & Netlik:** Sayfada dolgu yazılar, uzun pazarlama sloganları veya süsleyici gereksiz ögeler bulunamaz. Tasarım doğrudan veri odaklı ve temizdir.
2.  **E-Spor Estetiği (Premium Palette):** Çiğ parlak pembe/sarı neonlar yerine; kadife yakut kırmızısı, karamel kehribar altın ve derin gece mavisi zeminler kullanılır.
3.  **Çoklu Dil & Tema Esnekliği:** Başlıkta (Header) Açık/Koyu tema geçişi ile TR | EN dil seçimi için temiz ve sade kontroller yer alır.

---

## 2. Renk Değişkenleri (Color Tokens)

Aşağıdaki renkler koyu ve açık temaya göre dinamik olarak güncellenir.

### 2.1 Koyu Tema Değişkenleri (Dark Theme - Default)
*   **Arka Plan (Night Navy):** `#090d16` (Çok koyu mat gece mavisi)
*   **Panel / Kart Zemini:** `rgba(15, 23, 42, 0.55)` (Yarı saydam koyu cam panel)
*   **Ana Metin:** `#f8fafc` (Slate beyaz)
*   **İkincil Metin:** `#94a3b8` (Mat gri)
*   **Cam Kenarlığı:** `rgba(255, 255, 255, 0.05)` (Çok ince saydam çizgi)

### 2.2 Açık Tema Değişkenleri (Light Theme)
*   **Arka Plan (Slate White):** `#f8fafc` (Slate beyazı temiz zemin)
*   **Panel / Kart Zemini:** `rgba(255, 255, 255, 0.7)` (Açık renk şeffaf cam panel)
*   **Ana Metin:** `#0f172a` (Koyu slate text)
*   **İkincil Metin:** `#64748b` (Orta mat gri)
*   **Cam Kenarlığı:** `rgba(15, 23, 42, 0.08)` (Çok ince saydam koyu çizgi)

### 2.3 Vurgu ve Nadirlik Renkleri (Accents)
*   **İksir Kırmızısı (Elixir Ruby - Primary):** `#9d174d` (Kadifemsi yakut/mürdüm kırmızısı)
*   **Şampiyon Kehribarı (Amber Gold):** `#c27803` (Mat antik altın rengi)
*   **Evrim Moru (Royal Violet):** `#6b21a8` (Kraliyet koyu moru)
*   **Legendary Gradyanı:** `linear-gradient(135deg, #0284c7 0%, #3b82f6 100%)` (Okyanus mavisi geçiş)

---

## 3. Tipografi (Typography)

*   **Başlıklar (h1, h2, h3):** `font-family: 'Outfit', sans-serif;` (Modern, net, kalın kesimler).
*   **Gövde Metinleri (body, input, buttons):** `font-family: 'Inter', sans-serif;` (Yüksek okunabilirlikli matris düzeni).

---

## 4. Efektler & Kart Tasarımları

*   **Cam Kart Yapısı (`.glass-card`):** `backdrop-filter: blur(12px); border-radius: 12px;`
*   **Eksik Kart Görünümü (Simülasyon):** Oyuncuda bulunmayan kartlar `%30` opaklığa düşürülerek tamamen siyah-beyaz (`filter: grayscale(100%)`) yapılır ve üzerinde kırmızı renkli küçük bir "KİLİTLİ" ibaresi taşır.
*   **Eksik Evrim Görünümü:** Mor kesikli çizgili ince çerçeveyle gösterilir ve üzerinde "EVO KİLİTLİ" yazar.
*   **Mikro Etkileşimler:** Butonlara tıklandığında hafifçe içeri basılma (`scale(0.96)`) ve kartların üzerine gelindiğinde yukarı kayma (`translateY(-4px)`) efekti uygulanır.
