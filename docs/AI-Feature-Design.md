    # AI Incident Analysis Feature Design

    ## 1. User Story

    As an event organizer, I want an AI assistant that can analyze incident reports and provide actionable recommendations, so that I can respond quickly and accurately to emergencies.

    ---

    ## 2. System Architecture Sketch

    ```
    [Frontend Dashboard]
        |
        v
    [Backend API]
        |
        v
    [AI Service Layer]
        |
        v
    [LLM API (Gemini 2.5 Flash)]
        |
        v
    [Incident Data] <-> [External Data: Maps, Facilities]
        |
        v
    [Vector Database (optional, for RAG)]
    ```

    - **Data & Knowledge:** Incident reports, event metadata, location, media, external facilities data. ETL: cleaning, normalization. Embeddings/vector DB jika pakai RAG.
    - **Model Layer:** LLM API (Gemini 2.5 Flash), no fine-tuning, RAG opsional untuk info fasilitas.
    - **Orchestration:** Function calling (getGeminiIncidentAnalysis), workflow: report → AI → response.
    - **App Integration:** Frontend dashboard → backend API endpoint `/analyze-report` → AI service.
    - **Evaluation & Monitoring:** Monitor output quality (precision, recall), latency, user feedback.
    - **Responsible AI:** Content filter, safety rules, privacy by design.

    ---

    ## 3. Three Technical Decisions + Trade-offs

    - RAG vs Fine-Tuning → pilih RAG  
    Trade-off: Lebih fleksibel, bisa update knowledge, tapi latency sedikit lebih tinggi.
    - LLM API vs Local Model → pilih LLM API (Gemini)  
    Trade-off: Kualitas dan kemudahan, tapi biaya dan kontrol terbatas.
    - Vector Database vs Relational DB → pilih vector DB untuk RAG  
    Trade-off: Pencarian semantik lebih cepat, tapi biaya storage lebih tinggi.

    ---

    ## 4. Guardrails

    Sistem menggunakan RAG agar jawaban AI berbasis data insiden dan fasilitas nyata, bukan imajinasi model. Content filter dan validasi output diterapkan untuk mencegah hallucination dan informasi berbahaya. Privasi dijaga dengan membatasi akses data sensitif dan audit logging. Semua rekomendasi AI diverifikasi sebelum dikirim ke participant, memastikan output aman dan relevan.
