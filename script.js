// script.js 파일에 아래 내용 전체를 넣어주세요

// 🚨🚨🚨 복사한 실제 값으로 반드시 대체해야 합니다! 🚨🚨🚨
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
// ---------------------------------------------------------------------------------

// Supabase 클라이언트 초기화
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 숫자에 천 단위 쉼표를 넣어주는 함수
function formatNumber(num) {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('ko-KR');
}

// 🌟 Supabase에서 데이터를 가져와 화면에 표시하는 함수
async function showData() {
    const site = document.getElementById('site-select').value;
    const year = document.getElementById('year-select').value;
    const dataContainer = document.getElementById('data-display');

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
            dataContainer.innerHTML = `<div class="loading-message">🚨 ${site} ${year}년 데이터가 없습니다.</div>`;
            return;
        }

        // --- 표(Table) 생성 시작 ---
        let tableHTML = `
            <table class="data-table">
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
        dataContainer.innerHTML = `<div class="loading-message">🚨 데이터 로드 중 오류 발생: ${error.message}</div>`;
        console.error("Supabase Error: ", error);
    }
}
