const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const nasaApiKey = 'DMDaanpfK5hGUdrMA80Aw0jocMlRWfmtCYkUEzYg';  // Прямое использование API-ключа
const yandexApiKey = 'AQVN26kTOwnxSsi7vVGHD9-CKgYfurDdDdZTdoMp';  // API ключ Яндекс.Переводчика

// Отдавать статические файлы из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Функция перевода текста на русский
const translateText = async (text) => {
    try {
        const response = await axios.post(
            'https://translate.api.cloud.yandex.net/translate/v2/translate',
            {
                targetLanguageCode: 'ru',
                texts: [text],
            },
            {
                headers: {
                    'Authorization': `Api-Key ${yandexApiKey}`,
                },
            }
        );
        return response.data.translations[0].text;
    } catch (error) {
        console.error('Error translating text:', error);
        return text; // Если ошибка, возвращаем исходный текст
    }
};

app.get('/apod', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'apod.html'));
});

// Получение данных APOD (Astronomy Picture of the Day)
app.get('/api/apod', async (req, res) => {
    try {
        const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}`);
        const data = response.data;

        // Переводим описание картинки
        if (data.explanation) {
            data.explanation = await translateText(data.explanation);
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching APOD:', error);
        res.status(500).json({ error: 'Unable to fetch APOD data' });
    }
});

// Получение данных APOD за последние 7 дней
app.get('/api/apod-week', async (req, res) => {
    try {
        const apodData = [];
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        // Получаем данные для каждого дня в пределах недели
        for (let i = 0; i < 7; i++) {
            const date = oneWeekAgo.toISOString().split('T')[0]; // Формат YYYY-MM-DD
            const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}&date=${date}`);
            const data = response.data;

            // Переводим описание картинки
            if (data.explanation) {
                data.explanation = await translateText(data.explanation);
            }

            apodData.push(data);
            oneWeekAgo.setDate(oneWeekAgo.getDate() + 1); // Переходим к следующему дню
        }

        res.json(apodData);
    } catch (error) {
        console.error('Error fetching APOD for the past week:', error);
        res.status(500).json({ error: 'Unable to fetch APOD data for the past week' });
    }
});

app.get('/nasa-search', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'nasa-search.html'));
});

// Получение изображений из NASA Image and Video Library по запросу
app.get('/api/nasa-search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const response = await axios.get(`https://images-api.nasa.gov/search?q=${query}&media_type=image,video`);
        res.json(response.data);
    } catch (error) {
        console.error('Error searching NASA images:', error);
        res.status(500).json({ error: 'Unable to search NASA images' });
    }
});

// Маршрут для экзопланет
app.get('/api/exoplanets', async (req, res) => {
    try {
        const response = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}&count=5`);
        const data = response.data;

        // Переводим описание
        for (let item of data) {
            if (item.explanation) {
                item.explanation = await translateText(item.explanation);
            }
        }

        res.json(data); // Отправляем данные об экзопланетах
    } catch (error) {
        console.error('Error fetching exoplanet data:', error);
        res.status(500).json({ error: 'Unable to fetch exoplanet data' });
    }
});

// Рендер страницы галереи экзопланет
app.get('/exoplanet-archive', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'exoplanet-archive.html'));
});

// Получение фотографий с Perseverance
app.get('/api/rover-photos', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/photos?sol=1000&api_key=${nasaApiKey}`
        );

        res.json(response.data.photos);
    } catch (error) {
        console.error(`Error fetching photos from Perseverance:`, error);
        res.status(500).json({ error: 'Unable to fetch photos from Perseverance' });
    }
});

// Страница с фотографиями Perseverance
app.get('/rover-photos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'rover-photos.html'));
});


// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


