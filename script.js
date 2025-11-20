<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SDMC-ECO 에너지/탄소 현황</title>
    
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;500;700&display=swap" rel="stylesheet">
</head>
<body> 
    
    <header class="eco-header">
        <h1>🌳 SDMC-ECO 에너지/탄소 현황</h1>
        <p>사업소별 년도/월별 에너지 사용량, 요금 및 탄소배출량</p>
    </header>

    <div class="container">
        <div class="controls">
            <label for="site-select">사업소 선택:</label>
            <select id="site-select">
                <option value="공단청사">공단청사</option>
                </select>
            <label for="year-select">년도 선택:</label>
            <select id="year-select">
                <option value="2024">2024년</option>
                </select>
        </div>
        
        <section id="data-display">
            </section>
    </div>

    <footer>
        <p>&copy; 2024 SDMC-ECO Data Dashboard. Powered by Supabase.</p>
    </footer>

    <script src="script.js"></script>
</body>
</html>
