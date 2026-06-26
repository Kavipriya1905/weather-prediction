const cityInput = document.getElementById('city-input');
const getWeatherBtn = document.getElementById('get-weather-btn');
const weatherDisplay = document.getElementById('weather-display');
const historyList = document.getElementById('history-list');
weatherDisplay.innerHTML = '';

let recentCities = JSON.parse(localStorage.getItem('recentWeatherCities')) || [];

// Weather code → description + emoji
const weatherCodes = {
    0:   'Clear sky ☀️',
    1:   'Mainly clear 🌤️',
    2:   'Partly cloudy ⛅',
    3:   'Overcast ☁️',
    45:  'Fog 🌫️',
    48:  'Depositing rime fog 🌫️',
    51:  'Light drizzle 🌧️',
    53:  'Moderate drizzle 🌧️',
    55:  'Dense drizzle 🌧️',
    61:  'Slight rain 🌧️',
    63:  'Moderate rain 🌧️',
    65:  'Heavy rain 🌧️',
    71:  'Slight snow ❄️',
    73:  'Moderate snow ❄️',
    75:  'Heavy snow ❄️',
    80:  'Slight rain showers 🌦️',
    81:  'Moderate rain showers 🌦️',
    82:  'Violent rain showers 🌦️',
    95:  'Thunderstorm ⚡',
    96:  'Thunderstorm with slight hail ⚡🌨️',
    99:  'Thunderstorm with heavy hail ⚡🌨️'
};

// Update recent searches display
function updateHistory() {
    historyList.innerHTML = '';
    recentCities.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.onclick = () => {
            cityInput.value = city;
            getWeatherBtn.click();
        };
        historyList.appendChild(li);
    });
}

updateHistory();

// Get coordinates from city name
async function getCoordinates(city) {
    const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
    );
    const data = await res.json();
    if (!data.results || data.results.length === 0) {
        throw new Error('City not found');
    }
    return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country || ''
    };
}

// Fetch and display weather
async function fetchWeather(lat, lon, locationName) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');

    const data = await res.json();
    const current = data.current;

    const code = current.weather_code;
    const desc = weatherCodes[code] || 'Unknown condition';

    // Choose background class
    let bgClass = 'default';
    if (/clear|sun/i.test(desc))          bgClass = 'sunny';
    else if (/cloud|overcast/i.test(desc)) bgClass = 'cloudy';
    else if (/rain|shower|drizzle/i.test(desc)) bgClass = 'rainy';
    else if (/fog/i.test(desc))            bgClass = 'foggy';

    document.body.className = bgClass;
    const container = document.querySelector(".container");
    container.className = "container " + bgClass;

    weatherDisplay.innerHTML = `
        <h2>${locationName}</h2>
        <div class="condition-emoji">${desc}</div>
        <p style="font-size: 2.4em; font-weight: bold; color: #c62828;">
            ${current.temperature_2m} °C
        </p>
        <p><strong>Feels like:</strong> ${current.apparent_temperature} °C</p>
        <p><strong>Humidity:</strong> ${current.relative_humidity_2m}%</p>
        <p><strong>Wind:</strong> ${current.wind_speed_10m} km/h</p>
        <small>Updated: ${new Date(current.time).toLocaleString()}</small>
    `;

    // Save to recent (if not already there)
    const cityName = locationName.split(',')[0].trim();
    if (!recentCities.includes(cityName)) {
        recentCities.unshift(cityName);
        recentCities = recentCities.slice(0, 6);
        localStorage.setItem('recentWeatherCities', JSON.stringify(recentCities));
        updateHistory();
    }
}

// Main button handler
getWeatherBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) {
        weatherDisplay.innerHTML = '<p style="color: #e65100;">Please enter a city name</p>';
        return;
    }

    weatherDisplay.innerHTML = '<div class="loader"></div><p>Loading weather...</p>';

    try {
        const coords = await getCoordinates(city);
        await fetchWeather(
            coords.lat,
            coords.lon,
            `${coords.name}${coords.country ? ', ' + coords.country : ''}`
        );
    } catch (err) {
        weatherDisplay.innerHTML = `<p style="color: #d32f2f;">${err.message}</p>`;
    }
});