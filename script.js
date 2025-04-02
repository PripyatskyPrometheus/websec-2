document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        groupSelect: document.getElementById('selectGroup'),
        weekSelect: document.getElementById('selectWeek'),
        scheduleTable: document.getElementById('scheduleTable'),
        scheduleBody: document.getElementById('scheduleBody'),
        currentWeekDisplay: document.getElementById('currentWeek'),
        prevWeekButton: document.getElementById('prevWeek'),
        nextWeekButton: document.getElementById('nextWeek')
    };

    const fetchData = async (url, callback) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            callback(data);
        } catch (error) {
            console.error("Ошибка при получении данных:", error);
            elements.scheduleBody.innerHTML = '<tr><td colspan="8">Ошибка загрузки данных</td></tr>';
        }
    };

    const loadGroups = () => {
        fetchData('/api/groups', (groups) => {
            populateGroups(groups);
        });
    };

    const populateGroups = (groups) => {
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            elements.groupSelect.appendChild(option);
        });
    };

    const displaySchedule = (scheduleData) => {
        elements.scheduleBody.innerHTML = '';
        const { schedule, dates } = scheduleData;
        const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const timeSlots = Object.keys(schedule);

        const theadRow = elements.scheduleTable.querySelector('thead tr');
        theadRow.innerHTML = '';
        const timeHeader = document.createElement('th');
        timeHeader.textContent = 'Время';
        theadRow.appendChild(timeHeader);

        daysOfWeek.forEach((day, index) => {
            const dayHeader = document.createElement('th');
            dayHeader.textContent = `${day} (${dates[index] || ''})`;
            theadRow.appendChild(dayHeader);
        });

        timeSlots.forEach(time => {
            const row = document.createElement('tr');
            const timeCell = document.createElement('td');
            timeCell.textContent = time;
            row.appendChild(timeCell);

            daysOfWeek.forEach(day => {
                const lesson = schedule[time][day];
                const lessonCell = document.createElement('td');
                lessonCell.innerHTML = lesson || '-';
                row.appendChild(lessonCell);
            });

            elements.scheduleBody.appendChild(row);
        });
    };

    const updateWeekDisplay = (week) => {
        elements.currentWeekDisplay.textContent = `Неделя ${week}`;
    };

    elements.groupSelect.addEventListener('change', () => {
        const groupId = elements.groupSelect.value;
        const week = elements.weekSelect.value;
        fetchData(`/api/schedule?groupId=${groupId}&week=${week}`, displaySchedule);
    });

    elements.weekSelect.addEventListener('change', () => {
        const groupId = elements.groupSelect.value;
        const week = elements.weekSelect.value;
        fetchData(`/api/schedule?groupId=${groupId}&week=${week}`, displaySchedule);
        updateWeekDisplay(week);
    });

    elements.prevWeekButton.addEventListener('click', () => {
        let week = parseInt(elements.weekSelect.value);
        if (week > 1) {
            elements.weekSelect.value = week - 1;
            elements.weekSelect.dispatchEvent(new Event('change'));
        }
    });

    elements.nextWeekButton.addEventListener('click', () => {
        let week = parseInt(elements.weekSelect.value);
        if (week < 53) {
            elements.weekSelect.value = week + 1;
            elements.weekSelect.dispatchEvent(new Event('change'));
        }
    });

    const populateWeeks = () => {
        for (let i = 1; i <= 53; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Неделя ${i}`;
            elements.weekSelect.appendChild(option);
        }
    };

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

    const initialize = () => {
        loadGroups();
        populateWeeks();

        const currentWeek = getCurrentWeekNumber();
        elements.weekSelect.value = currentWeek;

        updateWeekDisplay(currentWeek);
        if (elements.groupSelect.options.length > 1) {
            const firstGroupId = elements.groupSelect.options[1].value;
            fetchData(`/api/schedule?groupId=${firstGroupId}&week=${currentWeek}`, displaySchedule);
        }
    };

    initialize();
});