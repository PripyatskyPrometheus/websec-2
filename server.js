const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const groups = {
    "1282690301": "6411-100503D", 
    "1282690279": "6412-100503D",
    "1213641978": "6413-100503D"
};

app.get('/api/groups', (req, res) => {
    const groupList = Object.entries(groups).map(([id, code]) => ({
        id: id,
        name: code.split('-')[0]
    }));
    res.json(groupList);
});

const fetchAndProcessSchedule = async (url, isTeacher = false) => {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const titleSelector = '.page-header h1.h1-text';
        const scheduleItemSelector = '.schedule__item:not(.schedule__head)';
        const timeItemSelector = '.schedule__time-item';
        const lessonSelector = '.schedule__lesson';
        const lessonTypeChipSelector = '.schedule__lesson-type-chip';
        const lessonInfoSelector = '.schedule__lesson-info';
        const disciplineSelector = '.body-text.schedule__discipline';
        const placeSelector = '.caption-text.schedule__place';
        const teacherLinkSelector = '.schedule__teacher a';
        const groupLinkSelector = 'a.caption-text.schedule__group';
        const headItemSelector = '.schedule__item.schedule__head';
        const headDateSelector = '.caption-text.schedule__head-date';

        const entityName = $(titleSelector).text().trim();
        if (!entityName) throw new Error('Не удалось получить имя.');

        const dates = [];
        $(headItemSelector).each((index, elem) => {
            const date = $(elem).find(headDateSelector).text().trim();
            if (date) dates.push(date);
        });

        const timeSlots = [];
        $(timeItemSelector).each((index, element) => {
            const time = $(element).text().trim();
            if (index % 2 === 0) {
                timeSlots.push(`${time} - `);
            } else {
                timeSlots[timeSlots.length - 1] += time;
            }
        });

        const scheduleData = {};
        timeSlots.forEach(time => {
            scheduleData[time] = {
                'Понедельник': '-',
                'Вторник': '-',
                'Среда': '-',
                'Четверг': '-',
                'Пятница': '-',
                'Суббота': '-'
            };
        });

        $(scheduleItemSelector).each((index, elem) => {
            const dayIndex = index % 6;
            const timeIndex = Math.floor(index / 6);
            const timeSlot = timeSlots[timeIndex];
            const dayOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][dayIndex];

            $(elem).find(lessonSelector).each((_, lessonElem) => {
                const lesson = $(lessonElem);
                const lessonTypeClass = lesson.find(lessonTypeChipSelector).attr('class');
                const subject = lesson.find(lessonInfoSelector).find(disciplineSelector).text().trim();
                const location = lesson.find(lessonInfoSelector).find(placeSelector).text().trim();
                let teacher = "Неизвестный преподаватель";
                try{
                    teacher = lesson.find(lessonInfoSelector).find(teacherLinkSelector).text().trim();
                } catch (e) {

                }

                let groups = [];
                lesson.find(lessonInfoSelector).find(groupLinkSelector).each((_, groupEl) => {
                    groups.push($(groupEl).text().trim());
                });

                let lessonDetails = `<b>${subject}</b><br>${location}<br>Преподаватель: ${teacher}<br>Группы: ${groups.join(', ')}`;

                let lessonColor = '';
                if (lessonTypeClass?.includes('lesson-type-1__bg')) lessonColor = 'green';
                else if (lessonTypeClass?.includes('lesson-type-2__bg')) lessonColor = 'pink';
                else if (lessonTypeClass?.includes('lesson-type-3__bg')) lessonColor = 'blue';
                else if (lessonTypeClass?.includes('lesson-type-4__bg')) lessonColor = 'orange';
                else if (lessonTypeClass?.includes('lesson-type-5__bg')) lessonColor = 'dark-blue';
                else if (lessonTypeClass?.includes('lesson-type-6__bg')) lessonColor = 'turquoise';

                if (scheduleData[timeSlot] && scheduleData[timeSlot][dayOfWeek] === '-') {
                    scheduleData[timeSlot][dayOfWeek] = `<div class="${lessonColor}">${lessonDetails}</div>`;
                } else if (scheduleData[timeSlot] && scheduleData[timeSlot][dayOfWeek] !== '-') {
                    scheduleData[timeSlot][dayOfWeek] += `<hr><div class="${lessonColor}">${lessonDetails}</div>`;
                }
            });
        });

        return {
            entityName: entityName,
            schedule: scheduleData,
            dates: dates
        };

    } catch (error) {
        console.error("Ошибка при получении расписания:", error);
        throw new Error("Ошибка при получении расписания.");
    }
};

app.get('/api/schedule', async (req, res) => {
    const { groupId, week } = req.query;

    if (!groupId || !week) {
        return res.status(400).json({ error: 'Необходимо указать groupId и week.' });
    }

    const url = `https://ssau.ru/rasp?groupId=${groupId}&selectedWeek=${week}`;
    try {
        const schedule = await fetchAndProcessSchedule(url);
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/teacherSchedule', async (req, res) => {
    const { staffId, week } = req.query;

    if (!staffId || !week) {
        return res.status(400).json({ error: 'Необходимо указать staffId и week.' });
    }

    const url = `https://ssau.ru/rasp?staffId=${staffId}&selectedWeek=${week}`;
    try {
        const schedule = await fetchAndProcessSchedule(url, true);
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/teacher.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'teacher.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});