<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Clash Royale Meta Deck Finder - AI Agents Guide (`agents.md`)

Bu dosya, projenin amacını, dosya yapısını, kullanılacak teknolojileri ve Yapay Zeka (AI) davranış kurallarını içerir. Yeni bir sohbet veya bağlam açıldığında, AI agent'ının projenin mevcut durumunu ve kurallarını hızlıca anlayabilmesi için tasarlanmıştır.

---

## 1. Proje Özeti (Project Overview)

Bu projenin amacı, Clash Royale oyuncularının kendi kart seviyelerine, sahip oldukları evrimlere (Evolutions) ve kahramanlara (Champions) göre o anki aktif Clash Royale metasındaki en uygun desteleri bulmasını ve filtrelemesini sağlamaktır.

### Temel Özellikler:
*   **Oyuncu Profili Sorgulama:** Oyuncunun oyuncu etiketi (player tag) ile Clash Royale API'sinden profil verilerini çekmek. Sahip olduğu kartları, seviyelerini, evrimlerini ve kahramanlarını analiz etmek.
*   **Meta Destelerin Çekilmesi:** Güncel metada en çok oynanan veya kazanma oranı en yüksek destelerin çekilmesi ve listelenmesi. RoyaleAPI proxy üzerinden Clash Royale API'si kullanılır.
*   **E-Sporcu (Pro) Deste Takibi:** `pro_players.json` dosyasında elle yönetilen pro oyuncu listesi (20+ oyuncu). Bu oyuncuların destelerini ayrı bir bölümde isimleriyle gösterme. İleride RoyaleAPI/Liquipedia gibi kaynaklardan otomatik liste çekme planlanmaktadır.
*   **Akıllı Deste Eşleştirme Algoritması:** Oyuncunun kart havuzunu meta destelerle karşılaştırıp en uygun olanları listelemek.
*   **Gelişmiş Filtreleme ve Öneri Sistemi:**
    *   *Kart Seçimi:* Belirli kartların destede olmasını zorunlu kılma.
    *   *Evrim Açma Simülasyonu:* "1 Evrim Açabilirim" veya "2 Evrim Açabilirim" — oyuncunun sahip olmadığı evrimi açma toleransı.
    *   *Hero Açma Simülasyonu:* "1 Hero Açabilirim" veya "2 Hero Açabilirim" — oyuncunun sahip olmadığı Hero slotundaki kartı (Hero Tombstone, Mighty Miner vb.) açma toleransı. **Not:** Buradaki "Hero" terimi, Clash Royale'deki Hero Slot'a (Slot 1) ve Wild Slot'a (Slot 2) yerleştirilebilen özel Hero/Champion kartlarını ifade eder. Normal kartlardan farklıdır.
    *   *Sıralama Seçenekleri:* "Önerilen" (rating formülü), "En Çok Oynanan" (useCount), "En Yüksek Kazanma Oranı" (winRate) olmak üzere 3 farklı sıralama kriteri.
*   **Geçmiş Sezon Metası ve Görsel Önbellekleme (Ek Özellikler):** 
    *   *Sezon Seçimi:* Aktif sezona ek olarak bir önceki sezonun dondurulmuş metası ile eşleştirme yapabilme imkanı.
    *   *Görsel Önbellek:* Supercell CDN değişikliklerinden etkilenmemek amacıyla görsellerin yerel depoda (`public/images/cards/`) barındırılması ve bulunamayan görseller için `onError CDN fallback` koruması.
*   **Modern Web Arayüzü:** Premium tasarıma sahip, dinamik ve mikro etkileşimli modern bir kullanıcı arayüzü.

---

## 2. Yapay Zeka Davranış Kuralları (AI Rules)

### 2.1 Onay Zorunluluğu
*   **Her büyük iş adımından önce** kullanıcıdan açık onay alınır.
*   "Büyük iş" örnekleri: yeni modül oluşturma, mimari değişiklik, yeni bağımlılık ekleme, veritabanı şeması değiştirme, mevcut dosyaları yeniden yapılandırma.
*   Basit düzeltmeler (typo, yorum ekleme, küçük refactor) doğrudan uygulanabilir.
*   Onay alınmadan hiçbir **yapım (implementation) aşamasına** geçilmez.

### 2.2 Fikir Üretme & Öneri
*   Yapay zeka yeni fikirler veya alternatif yaklaşımlar önerebilir.
*   Öneriler açıkça **"Öneri:"** etiketi ile sunulur.
*   Öneri sunulduktan sonra kullanıcı onayı beklenir; onay olmadan uygulanmaz.

### 2.3 Ücretsiz & Açık Kaynak Politikası
*   Kullanılan tüm kütüphaneler, araçlar ve veri kaynakları **ücretsiz ve açık kaynaklı** olmalıdır.
*   Ücretli API, servis veya eklenti **kesinlikle kullanılmaz**.
*   Telif hakkıyla korunan içerik (font, ikon, veri seti vb.) **kullanılmaz**.
*   Kullanılan her bağımlılığın lisansı `LICENSES.md` dosyasında belgelenir.

### 2.4 İleriye Yönelik Düşünme
*   Kod yazılırken "bu ileride nasıl genişler?" sorusu sorulur.
*   Hard-coded değerler (dil kodu, dosya yolu vb.) asla yazılmaz; sabitler veya yapılandırma dosyaları kullanılır.

### 2.5 İletişim Dili
*   Teknik tartışmalar ve dosya açıklamaları: **Türkçe**
*   Kaynak kod içi yorumlar ve dokümantasyon (KDoc/JSDoc): **İngilizce**

### 2.6 Arayüz İçerik Politikası (UI Content Policy)
*   **Yalınlık & Netlik:** Web sitesinde gereksiz, süslü/dekoratif yazılar, uzun pazarlama açıklamaları veya kalabalık bilgi yığınları kesinlikle bulunmamalıdır. Tasarım temiz, doğrudan veri odaklı, sade ve işlevsel olmalıdır.

---

## 3. Planlanan Dosya Yapısı (Target Folder Structure)

*Öneri: Projeyi bir Next.js (App Router) + TypeScript + Vanilla CSS yapısında kurmak, Clash Royale API'sine backend üzerinden (Route Handler) güvenli ve CORS engeline takılmadan istek atmamızı kolaylaştıracaktır.*

```text
CR/
├── agents.md               # Bu dosya (AI Kuralları ve Proje Yapısı)
├── progress.md             # Proje yapım fazları ve ilerleme durumu
├── DESIGN.md               # Google Stitch uyumlu tasarım sistemi (Renk, tipografi vb.)
├── LICENSES.md             # Kullanılan kütüphanelerin lisans bilgileri
├── package.json
├── next.config.js          # Yapılandırma dosyaları
├── .github/
│   └── workflows/
│       └── update-meta.yml # Her gün meta desteleri ve pro oyuncu destelerini çekip güncelleyen GitHub Action betiği
├── src/
│   ├── app/                # Next.js App Router sayfaları ve API route'ları
│   │   ├── layout.tsx      # Genel düzen (Layout)
│   │   ├── page.tsx        # Ana sayfa (Profil sorgulama ve deste listesi)
│   │   └── api/
│   │       └── player/     # Oyuncu verilerini çeken API proxy'si
│   ├── components/         # Yeniden kullanılabilir UI bileşenleri
│   │   ├── ProfileCard.tsx # Oyuncu profil kartı
│   │   ├── DeckList.tsx    # Destelerin listelendiği bileşen
│   │   ├── DeckCard.tsx    # Tekil deste kartı (Oyuna kopyalama butonu dahil)
│   │   └── Filters.tsx     # Kart filtreleme ve evrim simülasyonu bileşeni
│   ├── config/
│   │   └── index.ts        # Uygulama genel sabitleri (API limitleri, eşik değerleri vb.)
│   ├── data/
│   │   ├── meta_decks.json # GitHub Action tarafından derlenen en son meta desteler
│   │   ├── previous_season_decks.json # Bir önceki sezona ait dondurulmuş meta desteler
│   │   ├── current_season.json # Kayıtlı güncel sezon ID verisi
│   │   ├── season_accumulator.json # Sezon boyunca kümülatif maç verisi (günde 3 kez güncellenir)
│   │   ├── cards_static.json # cr-api-data'dan çekilen kart bilgileri (elixir, rarity)
│   │   ├── pro_players.json # Elle yönetilen pro oyuncu listesi (20+ oyuncu)
│   │   └── discovered_pros.json # Badge analizi ile keşfedilen potansiyel pro oyuncular
│   ├── services/           # Clash Royale API entegrasyonu ve iş mantığı
│   │   ├── royaleApi.ts    # Resmi API çağrıları (RoyaleAPI proxy üzerinden)
│   │   └── deckMatcher.ts  # Deste eşleştirme, hero/evo filtresi ve sıralama algoritması
│   ├── styles/             # Global stiller ve tasarım token'ları
│   │   ├── globals.css     # CSS Variables (Color, Typography, Shadows)
│   │   └── theme.css       # Premium tema ayarları (Dark mode, Glassmorphism)
│   └── utils/              # Yardımcı fonksiyonlar
│       ├── cardHelpers.ts  # cards_static.json'dan okuyan kart bilgi modülü
│       └── seasonHelper.ts # Sezon tarih hesaplayıcı (ilk Pazartesi, 09:00 UTC)

```

---

## 4. Altyapı ve Yayınlama (Deployment & Infrastructure)

### 4.1 Sunucu ve Barındırma (Hosting)
*   **Vercel (Hobi Planı):** Proje, Vercel üzerinde **tamamen ücretsiz** olarak barındırılacaktır. 
    *   Next.js ile tam entegre çalışır.
    *   İstemci tarafındaki CORS engellerini aşmak ve API Key'i gizlemek için Next.js **Route Handler (Serverless API)** desteği sunar.
    *   GitHub deposuna her kod gönderildiğinde (push) siteyi otomatik olarak derleyip yayına alır.

### 4.2 Otomatik Meta Veri Güncelleme Hattı (GitHub Actions Pipeline)
*   **Proxy:** Resmi Clash Royale API'si IP kısıtlaması uyguladığından, GitHub Actions ortamında `proxy.royaleapi.dev` üzerinden istek atılır. API anahtarı `45.79.218.79` IP'sine kayıtlıdır.
*   **Çalışma Sıklığı:** Günde **3 kez** (08:00, 16:00, 00:00 UTC = TR 11:00, 19:00, 03:00). Farklı saatlerde çalışarak farklı battlelog snapshot'larını yakalayıp kümülatif veri zenginliği sağlanır.
*   **Çözüm:** Depomuzda ücretsiz bir **GitHub Action** iş akışı çalışır.
    *   **Çoklu Bölge Stratejisi:** Global leaderboard PoL geçişinden beri boş döndüğü için, 15 farklı ülke leaderboard'undan (Fransa, Almanya, Türkiye, Japonya, ABD, Çin, Brezilya, Suudi Arabistan, İspanya, G. Kore, İtalya, Arjantin, Meksika, Finlandiya + Global) top 200 oyuncuları çekilir.
    *   Toplamda ~1000+ benzersiz oyuncunun sadece **battlelog** verisi çekilir (profil çekme kaldırıldı — %50 hız kazancı).
    *   `pro_players.json` dosyasındaki pro oyuncuların desteleri ayrıca etiketlenir.
    *   **Kümülatif Accumulator:** Her çalıştırmada veriler `season_accumulator.json` dosyasına kümülatif olarak eklenir. Sezon boyunca veri kalitesi sürekli artar.
    *   **API Limit Koruması:** İstekler arasına 100ms gecikme + exponential backoff ile yeniden deneme.
    *   **Failsafe:** Eğer 20'den az meta deste bulunursa, mevcut `meta_decks.json` korunur ve üzerine yazılmaz.
    *   Sonuçlar `meta_decks.json`'a yazılıp depoya otomatik commit edilir. Vercel siteyi yeniden derler.

#### 4.2.1 Veri Analiz Algoritması (GitHub Action Script Detayı)
GitHub Action tetiklendiğinde arka planda çalışan Node.js betiği (`scripts/update-meta.js`) şu adımları izler:
1.  **Kart Verisi İndirme:** `cr-api-data` reposundan kart meta verisi (elixir, rarity) indirilip `cards_static.json`'a kaydedilir.
2.  **Sezon Yönetimi:** Sezon ID'si hesaplanır (her ayın ilk Pazartesi 09:00 UTC). Sezon değişimi tespit edilirse accumulator arşivlenip sıfırlanır.
3.  **Çoklu Bölge Oyuncu Toplama:** 15 ülke leaderboard'undan top 200 oyuncular çekilir, tekilleştirilir. Fallback olarak top 5 klanın üyeleri taranır.
4.  **Battlelog Tarama:** Her oyuncunun `/battlelog` verisi çekilir (profil çekilmez). Sadece `pathOfLegend` modundaki maçlar işlenir.
5.  **Deste Analizi:** 8 kartın ID'leri sıralanıp benzersiz `deckId` oluşturulur. Slot konfigürasyonu (evo/hero/flex) ilk 3 pozisyondan takip edilir.
6.  **Kümülatif Birleştirme:** Günlük veriler `season_accumulator.json` ile merge edilir (useCount/winCount toplanır).
7.  **Rating Hesaplama:** `rating = winRate × 0.6 + normalize(useCount) × 0.4` formülüyle desteler puanlanır.
8.  **Çıktı:** En iyi 50 meta deste + 30 pro deste `meta_decks.json`'a yazılır. Eksik kart görselleri CDN'den indirilir.

### 4.3 Deste Kopyalama (Copy Deck) Özelliği
*   Clash Royale oyununun desteklediği resmi URL şemasını kullanacağız:
    `https://link.clashroyale.com/deck/en?deck=ID1;ID2;ID3;ID4;ID5;ID6;ID7;ID8`
*   Her deste kartında bir **"Oyuna Kopyala"** butonu olacak. Bu buton, kullanıcının cihazında oyunu otomatik olarak açarak desteyi doğrudan boş bir slota kopyalamasını sağlayacaktır.

### 4.4 Simülasyon Filtreleme Kuralları (Eksik Kart/Evrim/Hero)
*   **Varsayılan Durum:** Algoritma sadece kullanıcının o anki kart seviyeleri, evrimlerine ve hero kartlarına göre %100 kurabileceği desteleri listeler.
*   **İsteğe Bağlı Filtreler (Bağımsız Çalışır):**
    *   *Evrim Açabilirim:* "1 Evrim Açabilirim" veya "2 Evrim Açabilirim" — Oyuncunun sahip olduğu ama evrimleştirmediği kartlar için tolerans.
    *   *Hero Açabilirim:* "1 Hero Açabilirim" veya "2 Hero Açabilirim" — Oyuncunun sahip olmadığı **Hero Slot kartları** için tolerans. Hero Slot kartları: Hero Tombstone (Tomb Queen), Mighty Miner, Archer Queen, Golden Knight, Skeleton King, Monk gibi Hero/Champion sınıfı kartlar. Bunlar normal kartlardan farklıdır ve oyunda Hero Slotu veya Wild Slotu gerektirir.
    *   *Kart Açabilirim:* "1 Kart Açabilirim" veya "2 Kart Açabilirim" — Oyuncunun sahip olmadığı hero olmayan normal kartlar için tolerans.
*   **Sıralama Seçenekleri (Sorting):**
    *   *Önerilen (Varsayılan):* Rating formülü (`winRate × 0.6 + normalize(useCount) × 0.4`)
    *   *En Çok Oynanan:* `useCount` (kullanım sayısına göre azalan)
    *   *En Yüksek Kazanma Oranı:* `winRate` (kazanma yüzdesine göre azalan)
*   Deste üzerinde eksik olan kartlar, evrimler ve hero kartlar kullanıcıya ayrı ayrı tavsiye rozetiyle gösterilir (örn: *"1 Hero Gerekli: Hero Tombstone kartını açarak bu desteyi oynayabilirsiniz"*).

### 4.5 Mimari Kararlar ve Risk Yönetimi (Architecture & Risk Management)
*   **Failsafe (Hata Güvenliği):** GitHub Actions veri toplama betiği, çekilen veri miktarını doğrular. Eğer elde edilen geçerli meta deste sayısı belirlenen eşik değerinin (örn. en az 20 deste) altındaysa, işlem iptal edilir ve mevcut çalışan `meta_decks.json` dosyası üzerine yazılmaz.
*   **İstemci Tarafı Hesaplama (Client-Side Processing):** Kullanıcının kart havuzu ile meta destelerin karşılaştırılması ve simülasyon hesaplamaları tamamen tarayıcı (istemci) tarafında yapılır. Bu, sunucu yükünü sıfıra indirir ve arayüz filtrelerinin anlık (0ms gecikmeli) tepki vermesini sağlar.
*   **Gevşek Bağlı Yapı (Loosely Coupled):** Veri şeması ve servis katmanı olabildiğince bağımsız kurulacaktır. İleride tarihsel meta analizi yapılmak istenirse, static JSON dosya yapısından bir veritabanına (örn. Supabase veya Redis) geçiş kolayca yapılabilecektir.
