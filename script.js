// script.js 파일 - Supabase 데이터 로드 및 화면 출력 담당

// 🚨🚨🚨 복사한 실제 값으로 반드시 대체해야 합니다! 🚨🚨🚨
const SUPABASE_URL = 'https://sewmhqtmprbcofggbjfn.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld21ocXRtcHJiY29mZ2diamZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjkwNDgsImV4cCI6MjA3OTA0NTA0OH0.31vxwOHkxkFKXFlEZYxS4nXQlwCPlD1tesHqj2dpAG0';
// ---------------------------------------------------------------------------------

// 🏆 오류 해결: window.supabase 객체에서 createClient 함수를 호출하여 클라이언트 초기화
// 이전에 발생했던 'Cannot access 'supabase' before initialization' 오류를 해결합니다.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 숫자에 천 단위 쉼표를 넣어주는 함수
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    // 숫자를 로케일 형식으로 변환 (천 단위 쉼표 추가)
    return num.toLocaleString('ko-KR'); 
}

// 🌟 Supabase에서 데이터를 가져와 화면에 표시하는 함수
async function showData() {
    const site = document.getElementById('site-select').value.trim();
    
    // 💡 해결: data_year 컬럼이 DB에 정수(int4)로 저장되어 있으므로,
    // HTML에서 가져온 문자열 값('2024')을 정수(2024)로 변환합니다.
    const year = parseInt(document.getElementById('year-select').value, 10); 
    
    const dataContainer = document.getElementById('data-display');

    // 입력값 유효성 검사
    if (!site || isNaN(year)) {
        dataContainer.innerHTML = `<div class="loading-message">사업소와 연도를 모두 선택해주세요.</div>`;
        return;
    }

    dataContainer.innerHTML = `<div class="loading-message">데이터를 불러오는 중...</div>`;

    try {
        // Supabase에서 데이터 조회: site_name과 data_year가 일치하는 모든 행을 월 순서대로 가져옵니다.
        const { data: energyData, error } = await supabase
            .from('energy_data') 
            .select('*')         
            .eq('site_name', site)  // '공단청사' (문자열)
            .eq('data_year', year)  // 2024 (정수)
            .order('data_month', { ascending: true }); 

        if (error) throw error;

        if (!energyData || energyData.length === 0) {
            dataContainer.innerHTML = `<div class="loading-message error">🚨 **${site} ${year}년** 데이터가 없습니다.</div>`;
            return;
        }

        // --- 표(Table) 생성 시작 ---
        let tableHTML = `
            <table class="data-table">
                <caption>${site} (${year}년) 월별 에너지 및 탄소 배출 현황</caption>
                <thead>
                    <tr>
                        <th rowspan="2">월</th>
                        <th colspan="2" class="electric-usage">전기</th>
                        <th colspan="2" class="gas-usage">가스</th>
                        <th rowspan="2" class="carbon-usage">탄소배출량<br>(tCO2eq)</th>
                    </tr>
                    <tr>
                        <th class="electric-usage">사용량 (kWh)</th>
                        <th class="electric-usage">요금 (원)</th>
                        <th class="gas-usage">사용량 (㎥)</th>
                        <th class="gas-usage">요금 (원)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // 데이터 행을 추가합니다.
        energyData.forEach(row => {
            tableHTML += `
                <tr>
                    <td>${row.data_month}월</td>
                    <td class="electric-usage">${formatNumber(row.elec_usage)}</td>
                    <td class="electric-usage">${formatNumber(row.elec_cost)}</td>
                    <td class="gas-usage">${formatNumber(row.gas_usage)}</td>
                    <td class="gas-usage">${formatNumber(row.gas_cost)}</td>
                    <td class="carbon-usage">${formatNumber(row.carbon_emission)}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        dataContainer.innerHTML = tableHTML;

    } catch (error) {
        // 상세 오류 로그 (개발자용)
        console.error("Supabase Error: ", error);
        
        // 사용자 친화적 오류 메시지
        let errorMessage = error.message;
        if (errorMessage.includes("permission denied")) {
             errorMessage = "데이터 조회 권한(RLS SELECT Policy)이 부족합니다.";
        } 
        
        dataContainer.innerHTML = `<div class="loading-message error">🚨 데이터 로드 중 오류 발생: ${errorMessage}</div>`;
    }
}


// --- 이벤트 리스너 설정: 페이지 로드 후 실행 ---
document.addEventListener('DOMContentLoaded', () => {
    const siteSelect = document.getElementById('site-select');
    const yearSelect = document.getElementById('year-select');

    if (siteSelect && yearSelect) {
        // 드롭다운 값이 변경될 때마다 데이터를 다시 불러옵니다.
        siteSelect.addEventListener('change', showData);
        yearSelect.addEventListener('change', showData);

        // 페이지가 로드되자마자 초기 데이터를 불러옵니다.
        showData();
    } else {
        console.error("DOM 요소 (site-select 또는 year-select)를 찾을 수 없습니다. HTML을 확인해 주세요.");
    }
});
