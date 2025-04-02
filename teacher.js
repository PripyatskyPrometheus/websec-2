document.addEventListener('DOMContentLoaded', function() {
    const weekSelect = document.getElementById('selectWeek');
    const teacherScheduleDiv = document.getElementById('teacherSchedule');
    const currentWeekDiv = document.getElementById('currentWeek');
    const prevWeekButton = document.getElementById('prevWeek');
    const nextWeekButton = document.getElementById('nextWeek');

    function getStaffIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('staffId');
    }

    const staffId = getStaffIdFromUrl();

    function fetchSchedule(staffId, week) {
        if (!staffId) {
            teacherScheduleDiv.innerHTML = '<p>Не указан staffId в URL</p>';
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/teacherSchedule?staffId=${staffId}&week=${week}`, true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                const scheduleData = JSON.parse(xhr.responseText);
                renderSchedule(scheduleData);
            } else {
                console.error('Ошибка при получении расписания');
                teacherScheduleDiv.innerHTML = '<p>Ошибка при получении расписания</p>';
            }
        };
        xhr.onerror = function() {
            console.error('Ошибка сети при получении расписания');
            teacherScheduleDiv.innerHTML = '<p>Ошибка сети при получении расписания</p>';
        };
        xhr.send();
    }

    function renderSchedule(scheduleData) {
        teacherScheduleDiv.innerHTML = '';

        if (scheduleData && scheduleData.schedule) {
            const schedule = scheduleData.schedule;
            const dates = scheduleData.dates;
            const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
            const timeSlots = Object.keys(schedule);

            const table = document.createElement('table');
            table.className = 'schedule-table';

            const thead = document.createElement('thead');
            const theadRow = document.createElement('tr');
            const timeHeader = document.createElement('th');
            timeHeader.textContent = 'Время';
            theadRow.appendChild(timeHeader);

            for (let i = 0; i < daysOfWeek.length; i++) {
                const dayHeader = document.createElement('th');
                dayHeader.textContent = `${daysOfWeek[i]} (${dates[i] || ''})`;
                theadRow.appendChild(dayHeader);
            }
            thead.appendChild(theadRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            timeSlots.forEach(function(time) {
                const rowElement = document.createElement('tr');
                const timeCellElement = document.createElement('td');
                timeCellElement.textContent = time;
                rowElement.appendChild(timeCellElement);

                daysOfWeek.forEach(function(day) {
                    const lessonInfo = schedule[time][day];
                    const lessonCellElement = document.createElement('td');
                    lessonCellElement.innerHTML = lessonInfo || '-';
                    rowElement.appendChild(lessonCellElement);
                });
                tbody.appendChild(rowElement);
            });

            table.appendChild(tbody);
            teacherScheduleDiv.appendChild(table);

        } else {
            teacherScheduleDiv.innerHTML = '<p>Расписание не найдено</p>';
        }
    }

    function updateCurrentWeek(week) {
        currentWeekDiv.textContent = `Неделя ${week}`;
    }

    weekSelect.addEventListener('change', function() {
        const week = weekSelect.value;
        fetchSchedule(staffId, week);
        updateCurrentWeek(week);
    });

    prevWeekButton.addEventListener('click', function() {
        let currentWeek = parseInt(weekSelect.value);
        if (currentWeek > 1) {
            weekSelect.value = currentWeek - 1;
             weekSelect.dispatchEvent(new Event('change'));
        }
    });

    nextWeekButton.addEventListener('click', function() {
        let currentWeek = parseInt(weekSelect.value);
         if (currentWeek < 53) {
            weekSelect.value = currentWeek + 1;
             weekSelect.dispatchEvent(new Event('change')); 
        }
    });

    function populateWeeks() {
        for (let i = 1; i <= 53; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.text = `Неделя ${i}`;
            weekSelect.add(option);
        }
    }

    const getCurrentWeekNumber = () => {
        const now = new Date();
        const septemberFirst = new Date(now.getFullYear(), 8, 1);
    
        let startDate = septemberFirst;
        if (now < septemberFirst) {
            startDate = new Date(now.getFullYear() - 1, 8, 1);
        }
    
        const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksSinceStart = Math.ceil((now - startDate) / millisecondsInWeek);
        return weeksSinceStart;
    };

    populateWeeks();

    const currentWeek = getCurrentWeekNumber();
    weekSelect.value = currentWeek;

    updateCurrentWeek(currentWeek);
    fetchSchedule(staffId, currentWeek);
});