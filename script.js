// 🚨🚨🚨 복사한 실제 값으로 반드시 대체해야 합니다! 🚨🚨🚨
const SUPABASE_URL = 'https://sewmhqtmprbcofggbjfn.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld21ocXRtcHJiY29mZ2diamZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjkwNDgsImV4cCI6MjA3OTA0NTA0OH0.31vxwOHkxkFKXFlEZYxS4nXQlwCPlD1tesHqj2dpAG0';
// ---------------------------------------------------------------------------------

// 🛠️ 오류 수정: Supabase 클라이언트 초기화
// 'Cannot access 'supabase' before initialization' 오류를 해결하기 위해
// 전역 window.supabase 객체에서 createClient 함수를 호출하도록 수정합니다.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 숫자에 천 단위 쉼표를 넣어주는 함수
function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    // isNaN 체크를 추가하여 유효하지 않은 숫자 처리
    if (isNaN(num)) return '-'; 
    return num.toLocaleString('ko-KR');
}

// 🌟 Supabase에서 데이터를 가져와 화면에 표시하는 함수
async function showData() {
    const site = document.getElementById('site-select').value;
    const year = document.getElementById('year-select').value;
    const dataContainer = document.getElementById('data-display');

    // 입력값 유효성 검사 (필요에 따라)
    if (!site || !year) {
        dataContainer.innerHTML = `<div class="loading-message">사업소와 연도를 모두 선택해주세요.</div>`;
        return;
    }

    dataContainer.innerHTML = `<div class="loading-message">데이터를 불러오는 중...</div>`;

    try {
        // Supabase에서 데이터 조회: site_name과 data_year가 일치하는 모든 행을 월 순서대로 가져옵니다.
        const { data: energyData, error } = await supabase
            .from('energy_data') 
            .select('*')         
            .eq('site_name', site) 
            .eq('data_year', year) 
            .order('data_month', { ascending: true }); 

        if (error) throw error;

        if (!energyData || energyData.length === 0) {
            dataContainer.innerHTML = `<div class="loading-message">🚨 **${site} ${year}년** 데이터가 없습니다.</div>`;
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
        // 사용자에게 친절한 오류 메시지 제공
        let errorMessage = error.message;
        if (errorMessage.includes("permission denied")) {
             errorMessage = "데이터 조회 권한이 부족합니다. Supabase RLS 설정을 확인하세요.";
        } else if (errorMessage.includes("Cannot read properties of undefined")) {
            errorMessage = "초기화 오류가 재발생했습니다. 'supabase' 변수 초기화 코드를 확인하세요.";
        }

        dataContainer.innerHTML = `<div class="loading-message error">🚨 데이터 로드 중 오류 발생: ${errorMessage}</div>`;
        console.error("Supabase Error: ", error);
    }
}


// --- 이벤트 리스너 설정 ---

// 페이지 로드 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 셀렉트 박스가 DOM에 로드된 후, showData 함수를 연결합니다.
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
