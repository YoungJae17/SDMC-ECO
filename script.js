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
let lastTouchTime = 0; // 🚨 [추가] 모바일 더블 탭 감지를 위한 변수

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
        // 기존 confirm() 사용
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
            .order('data_month', { ascending: true });

        if (error) throw error;

        if (!energyData || energyData.length === 0) {
            dataContainer.innerHTML = `<div class="loading-message error">🚨 ${site} ${year}년 데이터가 없습니다.</div>`;
            return;
        }

        currentData = energyData;
        originalData = {};

        // --- 표(Table) 생성 시작 ---
        let tableHTML = `
            <div class="table-title-area">
                <span class="table-title">${site} (${year}년) 월별 에너지 및 탄소 배출 현황</span>
                <div class="table-actions">
                    <button id="save-all-button" class="edit-button" disabled>변경 사항 저장</button>
                </div>
            </div>
            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">💡 값을 '더블클릭' 또는 '더블 탭'하여 수정할 수 있습니다. 수정 후 '변경 사항 저장' 버튼을 누르세요.</p>
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
            const rowId = row.id;
            if (rowId) {
                // 원본 데이터 저장
                originalData[rowId] = {
                    elec_usage: row.elec_usage,
                    elec_cost: row.elec_cost,
                    gas_usage: row.gas_usage,
                    gas_cost: row.gas_cost,
                    carbon_emission: row.carbon_emission
                };
            }
            tableHTML += `
                <tr data-id="${rowId}">
                    <td>${row.data_month}월</td>
                    <td class="editable-cell electric-usage" data-field="elec_usage">${formatNumber(row.elec_usage)}</td>
                    <td class="editable-cell electric-usage" data-field="elec_cost">${formatNumber(row.elec_cost)}</td>
                    <td class="editable-cell gas-usage" data-field="gas_usage">${formatNumber(row.gas_usage)}</td>
                    <td class="editable-cell gas-usage" data-field="gas_cost">${formatNumber(row.gas_cost)}</td>
                    <td class="editable-cell carbon-usage" data-field="carbon_emission">${formatNumber(row.carbon_emission)}</td>
                </tr>
            `;
        });

        tableHTML += `</tbody></table>`;
        dataContainer.innerHTML = tableHTML;

        // --- 이벤트 연결 ---
        document.querySelectorAll('.editable-cell').forEach(cell => {
            // 1. 데스크톱용: 기존 dblclick 유지
            cell.addEventListener('dblclick', handleCellDblClick);
            
            // 2. 모바일용: touchstart 리스너 추가 (더블 탭 감지)
            cell.addEventListener('touchstart', handleDoubleTap);
        });
        document.getElementById('save-all-button').addEventListener('click', saveChanges);

    } catch (error) {
        console.error("Supabase Error: ", error);
        let errorMessage = error.message;
        if (errorMessage && errorMessage.includes("permission denied")) {
            errorMessage = "데이터 조회 권한(RLS SELECT Policy)이 부족합니다.";
        } else if (!errorMessage) {
            errorMessage = "알 수 없는 오류가 발생했습니다.";
        }
        dataContainer.innerHTML = `<div class="loading-message error">🚨 데이터 로드 중 오류 발생: ${errorMessage}</div>`;
    }
}

/**
 * 🚨 [추가] 모바일 더블 탭 처리를 위한 새로운 핸들러
 * 300ms 이내에 두 번 터치되었는지 확인하고 편집 모드를 시작합니다.
 * @param {Event} event 
 */
function handleDoubleTap(event) {
    // 1개 이상의 터치(멀티 터치)는 무시
    if (event.touches.length > 1) return; 

    const touchTime = new Date().getTime();
    
    // 300ms(0.3초) 이내에 두 번째 탭이 들어왔는지 확인
    if (touchTime - lastTouchTime < 300) {
        event.preventDefault(); // 더블 탭 시 확대/축소 방지 (CSS에서도 처리했지만 JS에서 한 번 더 보강)
        const cell = event.currentTarget;
        
        // 더블 탭으로 인식되면 기존 더블 클릭 핸들러를 호출하여 편집 모드 시작
        // dblclick 핸들러가 event.currentTarget을 기대하므로 객체를 만들어서 전달
        handleCellDblClick({ currentTarget: cell }); 
        lastTouchTime = 0; // 초기화
    } else {
        lastTouchTime = touchTime;
    }
}


/**
 * 3. 셀 더블클릭 핸들러: TD를 INPUT으로 변환 (데스크톱 및 JS 호출용)
 * @param {Event} event - 더블클릭 이벤트 (또는 touchstart에 의해 모의된 이벤트 객체)
 */
function handleCellDblClick(event) {
    const cell = event.currentTarget;

    // 이미 편집 중인 셀이면 무시
    if (cell.querySelector('input')) return;

    const rowId = cell.closest('tr').dataset.id;
    const field = cell.dataset.field;

    // 현재 표시된 텍스트(쉼표 제거)를 값으로 사용
    const initialValue = cell.textContent.replace(/,/g, '').replace(/-/g, '0');

    // 입력 필드 생성
    const input = document.createElement('input');
    input.type = 'number';
    input.step = (field === 'carbon_emission') ? '0.1' : '1'; // 탄소배출량은 소수점 허용
    input.value = initialValue;
    input.className = 'editable-input';

    // 기존 텍스트 제거 및 input 추가
    cell.textContent = '';
    cell.appendChild(input);
    input.focus();

    // 포커스를 잃었을 때 (다른 곳을 클릭하거나 탭 이동) 값 처리
    input.addEventListener('blur', () => handleInputBlur(input, cell, rowId, field));
    // Enter 키를 눌렀을 때도 blur 이벤트와 동일하게 작동
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 폼 제출 방지
            input.blur();
        }
    });
}

/**
 * 4. 입력 필드 포커스 아웃 핸들러: 값 비교 및 임시 저장
 * @param {HTMLInputElement} input - 입력 필드 요소
 * @param {HTMLElement} cell - TD 셀 요소
 * @param {string} rowId - 데이터베이스 행 ID
 * @param {string} field - 데이터베이스 컬럼 이름
 */
function handleInputBlur(input, cell, rowId, field) {
    const newValue = parseFloat(input.value);

    // 원본 값 찾기: originalData에 저장된 값, 없으면 0
    let originalValue = originalData[rowId] ? originalData[rowId][field] : 0;

    // 수정된 값으로 셀 업데이트 (쉼표 추가)
    cell.textContent = formatNumber(newValue);

    // input 필드 제거
    input.remove();

    // 값 변경 감지 및 임시 저장
    if (newValue !== originalValue && !isNaN(newValue)) {
        // 변경된 값 임시 저장
        modifiedCells[rowId] = modifiedCells[rowId] || {};
        modifiedCells[rowId][field] = newValue;
        cell.classList.add('modified'); // CSS로 변경된 셀 시각적 표시
    } else {
        // 변경된 값이 없거나 원본으로 돌아갔으면 임시 저장 목록에서 제거
        if (modifiedCells[rowId]) {
            delete modifiedCells[rowId][field];
            if (Object.keys(modifiedCells[rowId]).length === 0) {
                delete modifiedCells[rowId];
            }
        }
        cell.classList.remove('modified');
    }

    // 저장 버튼 활성화/비활성화
    const saveButton = document.getElementById('save-all-button');
    if (Object.keys(modifiedCells).length > 0) {
        saveButton.disabled = false;
    } else {
        saveButton.disabled = true;
    }
}

/**
 * 5. 변경 사항 저장 및 Supabase에 반영 (Save Button Click)
 */
async function saveChanges() {
    const changesToSave = [];

    // modifiedCells 객체를 업데이트 형식 배열로 변환
    for (const rowId in modifiedCells) {
        if (Object.keys(modifiedCells[rowId]).length > 0) {
            changesToSave.push({ id: rowId, ...modifiedCells[rowId] });
        }
    }

    if (changesToSave.length === 0) {
        // 기존 alert() 사용
        alert("변경된 데이터가 없습니다.");
        return;
    }

    // 기존 confirm() 사용
    if (!confirm(`${changesToSave.length}건의 변경 사항을 데이터베이스에 반영하시겠습니까?`)) {
        return;
    }

    // 2. 저장 상태 표시 및 버튼 비활성화
    const dataContainer = document.getElementById('data-display');
    const saveButton = document.getElementById('save-all-button');
    saveButton.disabled = true;
    dataContainer.insertAdjacentHTML('beforebegin', '<p id="save-status" style="color: #38761d; text-align: center; font-weight: bold;">데이터 저장 중...</p>');

    // 3. Supabase 업데이트 쿼리 실행
    const updatePromises = changesToSave.map(change => {
        const { id, ...updateData } = change;
        return supabase
            .from('energy_data')
            .update(updateData)
            .eq('id', id);
    });

    const results = await Promise.all(updatePromises);
    document.getElementById('save-status').remove();

    // 4. 결과 메시지 출력 및 상태 초기화
    const hasError = results.some(res => res.error);
    const messageColor = hasError ? 'red' : 'green';
    const messageText = hasError ?
        '🚨 저장 실패! 일부 업데이트 오류 발생. (콘솔 확인)' :
        '✅ 변경 사항이 성공적으로 저장되었습니다.';

    dataContainer.insertAdjacentHTML('beforebegin', `<p id="final-status" style="color: ${messageColor}; text-align: center; font-weight: bold;">${messageText}</p>`);

    // 상태 초기화 후 데이터 새로고침
    modifiedCells = {};
    setTimeout(() => {
        const statusMsg = document.getElementById('final-status');
        if (statusMsg) statusMsg.remove();
        showData(); // 데이터 새로고침 (최신 데이터 반영)
    }, 1500);
}


// --- 이벤트 리스너 설정: 페이지 로드 후 실행 ---
document.addEventListener('DOMContentLoaded', () => {
    const siteSelect = document.getElementById('site-select');
    const yearSelect = document.getElementById('year-select');

    if (siteSelect && yearSelect) {
        siteSelect.addEventListener('change', showData);
        yearSelect.addEventListener('change', showData);
        showData();
    }
});
