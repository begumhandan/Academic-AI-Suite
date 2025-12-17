# 🎓 Academic AI Suite

<div align="center">
  
  ![Status](https://img.shields.io/badge/Status-Prototype-orange)
  ![License](https://img.shields.io/badge/License-MIT-blue)
  ![Tech](https://img.shields.io/badge/Built%20With-React%20%7C%20Vite%20%7C%20Gemini-blueviolet)

  **Yapay Zeka Merkezli Akademik Doküman Editörü**
  
  *Akademik yazım sürecini sadece kolaylaştıran değil, yapılandıran ve yöneten akıllı bir asistan.*

  [Demo Videosunu İzle](#-demo) • [Kurulum](#-kurulum) • [Özellikler](#-özellikler)
</div>

---

## 📖 Proje Hakkında

**Academic AI Suite**, akademik yazım sürecini yapay zekâ merkezli bir yaklaşımla yeniden tasarlayan bir doküman editörü prototipidir. 

Bu projenin temel amacı; yapay zekâyı yalnızca metin üreten ("text generator") bir araç olarak değil, akademik yazım sürecinde **karar destekleyici bir asistan** olarak konumlandırmaktır. AI, yazarın yerine geçmez; yazarın aldığı kararları daha hızlı, tutarlı ve standartlara uygun hale getirir.

> **"Yapay zeka metin üretmekten ziyade, süreci yönetir."**

## 🎥 Demo

Projenin çalışır halini ve temel özelliklerini aşağıdaki videodan izleyebilirsiniz:

[![Academic AI Suite Demo](http://img.youtube.com/vi/dSTozXuNRmg/0.jpg)](https://www.youtube.com/watch?v=dSTozXuNRmg)

> **Proje Linki:** [Google AI Studio üzerinde inceleyin](https://ai.studio/apps/drive/1IPyN_7uOoo3EFHx95UhFa2GDt0nkuXtx?fullscreenApplet=true)

---

## 🚀 Özellikler

### ✍️ Metin Düzenleme & Akademik Dil
*   **Gramer & Stil Analizi:** Anlatım bozukluklarını, gramer hatalarını ve gereksiz tekrarları tespit eder.
*   **Akademik Ton:** Metninizi daha resmi ve akademik bir dile çevirmek için öneriler sunar.
*   **Akıllı Karşılaştırma:** Yapılan değişiklikleri öncesi/sonrası şeklinde detaylıca gösterir.

### 🌍 Akademik Çeviri (TR ↔ EN)
*   **Bağlam Odaklı Çeviri:** Sadece kelime çevirisi değil, terminolojiye uygun bağlamsal çeviri yapar.
*   **Üslup Koruma:** Bilimsel metinlerin gerektirdiği resmi ve edilgen çatı yapısını korur.

### 📑 Literatür & Metin Özetleme
*   **Esnek Özetleme:** İster betimleyici, ister eleştirel özetler oluşturun.
*   **Uzunluk Kontrolü:** Özetin ne kadar detaylı olacağını siz belirleyin.

### 📝 AI Destekli Editör
*   **Doğal Dil Komutları:** *"Bu paragrafı daha akademik yaz"* veya *"Giriş bölümünü genişlet"* gibi komutlarla düzenleme yapın.
*   **Bölüm Bazlı Kontrol:** Tüm metni değil, sadece seçtiğiniz alanları optimize edin.

### 📚 Kaynakça & Atıf Yönetimi
*   **Otomatik Formatlama:** APA, MLA, IEEE ve Harvard gibi popüler stillerde otomatik kaynakça oluşturur.
*   **Standartlara Uygunluk:** Atıfların doğruluğunu ve tutarlılığını denetler.

---

## 🛠️ Kullanılan Teknolojiler ve Araçlar

Bu proje modern web teknolojileri ve gelişmiş AI modelleri kullanılarak geliştirilmiştir.

| Alan | Teknoloji / Araç |
|------|------------------|
| **Frontend** | React, Vite, TypeScript |
| **AI Model** | Google Gemini (via Google AI Studio) |
| **Tasarım** | Google Stitch, Akademik UI/UX Prensipleri |
| **Analiz** | NotebookLM (Kavramsal analiz için) |

---

## 💻 Kurulum

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin:

1.  **Repoyu klonlayın:**
    ```bash
    git clone https://github.com/begumhandan/scholarai.git
    cd scholarai
    ```

2.  **Bağımlılıkları yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    `.env.local` dosyası oluşturun ve Gemini API anahtarınızı ekleyin:
    ```env
    VITE_GEMINI_API_KEY=sizin_api_anahtariniz
    ```

4.  **Uygulamayı başlatın:**
    ```bash
    npm run dev
    ```

---

## 🔍 Projenin Vizyonu

**Academic AI Suite**, akademik yazımda yapay zekânın **kontrol edilebilir, şeffaf ve kullanıcıyla birlikte çalışan** bir yardımcı olarak nasıl tasarlanabileceğine dair bir vizyon sunar. Hedefimiz, araştırmacıların ve öğrencilerin teknik detaylarda boğulmadan içeriklerine odaklanmalarını sağlamaktır.
