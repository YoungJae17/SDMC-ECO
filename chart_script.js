// chart_script.js 파일 - 차트 데이터 로드 및 시각화 담당

// 🚨🚨🚨 복사한 실제 값으로 반드시 대체해야 합니다! 🚨🚨🚨
const SUPABASE_URL = 'https://sewmhqtmprbcofggbjfn.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNld21ocXRtcHJiY29mZ2diamZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NjkwNDgsImV4cCI6MjA3OTA0NTA0OH0.31vxwOHkxkFKXFlEZYxS4nXQlwCPlD1tesHqj2dpAG0';
// ---------------------------------------------------------------------------------

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let myChart = null; // 차트 객체를 저장할 전역 변수

// 🌟 Supabase에서 데이터를 가져와 차트를 그리는 함수
async function drawChart() {
    const site = document.getElementById('site-select').value.trim();
    const year = parseInt(document.getElementById('year-select').value, 10); 
    const chartErrorDiv = document.getElementById('chart-error');
    const chartCanvas = document.getElementById('energyChart');

    chartErrorDiv.style.display = 'none'; // 오류 메시지 숨김
    
    // 로딩 중임을 사용자에게 알립니다.
    if (myChart) {
        myChart.destroy();
        myChart = null;
    }
    chartCanvas.style.display = 'none';

    try {
        const { data: energyData, error } = await supabase
            .from('energy_data') 
            .select('*')         
            .eq('site_name', site) 
            .eq('data_year', year)  
            .order('data_month', { ascending: true }); 

        if (error) throw error;

        if (!energyData || energyData.length === 0) {
            chartErrorDiv.innerText = `🚨 ${site} ${year}년 데이터가 없습니다.`;
            chartErrorDiv.style.display = 'block';
            return;
        }

        // --- 데이터 가공 ---
        const labels = energyData.map(row => `${row.data_month}월`); // 월별 레이블
        const elecUsage = energyData.map(row => row.elec_usage); // 전기 사용량
        const carbonEmission = energyData.map(row => row.carbon_emission); // 탄소 배출량

        chartCanvas.style.display = 'block'; // 데이터 로드 성공 시 캔버스 표시

        // 기존 차트가 있으면 파괴 (차트 업데이트 시 메모리 누수 방지)
        if (myChart) {
            myChart.destroy();
        }

        // --- Chart.js를 사용하여 차트 그리기 ---
        const ctx = chartCanvas.getContext('2d');
        myChart = new Chart(ctx, {
            type: 'bar', // 기본은 막대 차트
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '전기 사용량 (kWh)',
                        data: elecUsage,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)', // 파란색
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1', // 첫 번째 Y축 사용
                    },
                    {
                        label: '탄소 배출량 (tCO2eq)',
                        data: carbonEmission,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)', // 녹색
                        borderColor: 'rgba(75, 192, 192, 1)',
                        type: 'line', // 탄소 배출량은 꺾은선으로 표시
                        fill: false,
                        yAxisID: 'y2', // 두 번째 Y축 사용
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${site} (${year}년) 월별 에너지/탄소 배출 추이`,
                        font: { size: 18 }
                    }
                },
                scales: {
                    y1: { // 왼쪽 Y축: 전기 사용량
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: '전기 사용량 (kWh)' }
                    },
                    y2: { // 오른쪽 Y축: 탄소 배출량
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false }, // 그리드 영역 표시 안 함
                        title: { display: true, text: '탄소 배출량 (tCO2eq)' }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Chart Data Load Error: ", error);
        chartErrorDiv.innerText = `🚨 차트 데이터 로드 중 오류 발생: ${error.message}`;
        chartErrorDiv.style.display = 'block';
    }
}


// --- 이벤트 리스너 설정: 페이지 로드 후 실행 ---
document.addEventListener('DOMContentLoaded', () => {
    const siteSelect = document.getElementById('site-select');
    const yearSelect = document.getElementById('year-select');

    if (siteSelect && yearSelect) {
        // 드롭다운 값이 변경될 때마다 차트를 다시 그립니다.
        siteSelect.addEventListener('change', drawChart);
        yearSelect.addEventListener('change', drawChart);

        // 페이지가 로드되자마자 초기 차트를 그립니다.
        drawChart();

    } else {
        console.error("DOM 요소 (site-select 또는 year-select)를 찾을 수 없습니다. HTML을 확인해 주세요.");
    }
});
