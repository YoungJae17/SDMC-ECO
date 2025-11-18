// script.js

// 숫자를 천 단위로 쉼표를 넣어 포맷팅하는 함수
function formatNumber(num) {
    // 탄소배출량(소수점 존재 가능)과 일반 숫자 포맷을 분리 처리
    if (Number.isInteger(num)) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        return num.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
}

// 선택된 사업소와 년도에 맞는 데이터를 표시하는 함수
function showData() {
    const site = document.getElementById('site-select').value;
    const year = document.getElementById('year-select').value;
    const dataContainer = document.getElementById('data-display');
    
    const data = energyData[site] && energyData[site][year] ? energyData[site][year] : null;

    if (!data) {
        dataContainer.innerHTML = `<div class="loading-message">🚨 ${site} ${year}년 데이터가 없습니다.</div>`;
        return;
    }

    // 표(Table) 생성
    let tableHTML = `
        <table class="data-table">
            <caption>${site} (${year}년) 월별 에너지 및 탄소 현황</caption>
            <thead>
                <tr>
                    <th rowspan="2">월</th>
                    <th colspan="2">전기 (Electricity)</th>
                    <th colspan="2">가스 (Gas)</th>
                    <th rowspan="2">탄소배출량 (tCO2eq)</th>
                </tr>
                <tr>
                    <th>사용량 (kWh)</th>
                    <th>사용요금 (원)</th>
                    <th>사용량 (㎥)</th>
                    <th>사용요금 (원)</th>
                </tr>
            </thead>
            <tbody>
    `;

    // 데이터 행 추가
    data.forEach(row => {
        // 배열 해체 할당 (월, 전기량, 전기요금, 가스량, 가스요금, 탄소배출량)
        const [month, elecUsage, elecCost, gasUsage, gasCost, carbonEmission] = row;
        
        tableHTML += `
            <tr>
                <td>${month}월</td>
                <td class="electric-usage">${formatNumber(elecUsage)}</td>
                <td class="electric-usage">${formatNumber(elecCost)}</td>
                <td class="gas-usage">${formatNumber(gasUsage)}</td>
                <td class="gas-usage">${formatNumber(gasCost)}</td>
                <td class="carbon-usage">${formatNumber(carbonEmission)}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    dataContainer.innerHTML = tableHTML;
}

// 페이지 로드 시 기본 데이터 표시
document.addEventListener('DOMContentLoaded', () => {
    // 초기에는 공단청사, 2024년 데이터로 표시
    showData();
});
