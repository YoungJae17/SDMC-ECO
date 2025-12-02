// script.js 파일 - Supabase 데이터 로드 및 더블클릭 편집 기능 구현

// 🚨🚨🚨 복사한 실제 값으로 반드시 대체해야 합니다! 🚨🚨🚨
// SUPABASE API 설정: API Keys > Project URL 및 anon public Key를 확인하여 입력하세요.
const SUPABASE_URL = 'https://sewmhqtmprbcofggbjfn.supabase.co'; // [Supabase Project URL]
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld21ocXRtcHJiY29mZ2diamZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjkwNDgsImV4cCI6MjA3OTA0NTA0OH0.31vxwOHkxkFKXFlEZYxS4nXQlwCPlD1tesHqj2dpAG0'; // [Supabase Anon Public Key]
// ---------------------------------------------------------------------------------

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 상태 변수
let currentData = [];
let originalData = {}; // {row_id: {column: value, ...}} 원본 데이터
let modifiedCells = {}; // {row_id: {column: new_value, ...}} 변경된 데이터 임시 저장

// 숫자에 천 단위 쉼표를 넣어주는 함수
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    // 탄소 배출량처럼 소수점 이하가 필요한 경우를 위해 toLocaleString 대신 직접 구현
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 🌟 Supabase에서 데이터를 가져와 화면에 표시하는 함수
async function showData() {
    const site = document.getElementById('site-select').value.trim();
    const year = parseInt(document.getElementById('year-select').value, 10);
    const dataContainer = document.getElementById('data-display');

    if (!site || isNaN(year)) {
        dataContainer.innerHTML = `<div class="loading-message">사업소와 연도를 모두 선택해주세요.</div>`;
        return;
    }

    // 변경사항이 남아있으면 경고
    if (Object.keys(modifiedCells).length > 0) {
        if (!confirm("저장하지 않은 변경사항이 있습니다. 페이지를 다시 로드하시겠습니까?")) {
            return;
        }
    }
    modifiedCells = {}; // 변경사항 초기화

    dataContainer.innerHTML = `<div class="loading-message">데이터를 불러오는 중...</div>`;

    try {
        const { data: energyData, error } = await supabase
            .from('energy_data')
            .select('*')
            .eq('site_name', site)
            .eq('data_year', year)
    }
    