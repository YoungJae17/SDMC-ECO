// script.js

// 숫자를 천 단위로 쉼표를 넣어 포맷팅하는 함수
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 선택된 사업소와 년도에 맞는 데이터를 표시하는 함수
function showData(site) {
    const year = document.getElementById('year-select').value;
    const dataContainer = document.getElementById('data-display');
    
    // 선택된 사업소/년도의 데이터 확인
    const data = energyData[site] && energyData[site][year] ? energyData[site][year] : null;

    if (!data) {
        dataContainer.innerHTML = `<div class="loading-message">🚨 ${site} ${year}년 데이터가 없습니다.</div>`;
        return;
    }

    // 표(Table) 생성
    let tableHTML = `
        <table class="data-table">
            <caption>${site} (${year}년) 월별 에너지 사용 현황</caption>
            <thead>
                <tr>
                    <th rowspan="2">월</th>
                    <th colspan="2">전기 (Electricity)</th>
                    <th colspan="2">가스 (Gas)</th>
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
        const [month, elecUsage, elecCost, gasUsage, gasCost] = row;
        tableHTML += `
            <tr>
                <td>${month}월</td>
                <td class="electric-usage">${formatNumber(elecUsage)}</td>
                <td class="electric-usage">${formatNumber(elecCost)}</td>
                <td class="gas-usage">${formatNumber(gasUsage)}</td>
                <td class="gas-usage">${formatNumber(gasCost)}</td>
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
    // 공단청사 데이터로 초기화
    showData(document.getElementById('site-select').value);
});
