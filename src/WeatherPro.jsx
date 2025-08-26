import React, { useState, useEffect, useRef } from "react";
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  MapPin,
  Moon,
} from "lucide-react";

const WeatherApp = () => {
  const apiKey = "e305f3f3f3af04adb4ffcaa93869c6c5"; 

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [umbrellaMessage, setUmbrellaMessage] = useState("");
  const [notificationTime, setNotificationTime] = useState(""); // HH:MM
  const [notificationSet, setNotificationSet] = useState(false);
  const [nextNotificationCountdown, setNextNotificationCountdown] = useState("");
  const notificationTimerRef = useRef(null); 

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  
  const needsUmbrella = () => {
    if (!weather) return false;
    const condition = weather.weather[0].main.toLowerCase();
    return condition.includes("rain") || condition.includes("drizzle");
  };

 
  const windDirection = (deg) => {
    const directions = [
      "N","NNE","NE","ENE","E","ESE","SE","SSE",
      "S","SSW","SW","WSW","W","WNW","NW","NNW"
    ];
    return directions[Math.round(deg / 22.5) % 16];
  };

 
  const formatUnixTime = (unix) => {
    return new Date(unix * 1000).toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  
  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      if (!res.ok) throw new Error("Unable to fetch weather data");
      const data = await res.json();
      setWeather(data);

      
      if (needsUmbrella()) {
        setUmbrellaMessage(`🌂 Yes! It's raining in ${data.name}. Take your umbrella!`);
      } else {
        setUmbrellaMessage(`☀️ No rain in ${data.name}. Umbrella not needed.`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
        },
        () => setError("Unable to get location. Allow location and refresh."),
      );
    } else {
      setError("Geolocation not supported in this browser.");
    }
  }, []);


  const scheduleNotification = (hour, minute) => {
    if (!weather || !("Notification" in window)) return;

    
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);

    const sendNotification = () => {
      const message = needsUmbrella()
        ? `🌂 It's raining today in ${weather.name}. Take your umbrella!`
        : `☀️ No rain today in ${weather.name}.`;
      if (Notification.permission === "granted") {
        new Notification("Daily Weather Update", { body: message });
      }
    };

    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target < now) target.setDate(target.getDate() + 1);
    const timeout = target - now;

    const countdownInterval = setInterval(() => {
      const diff = target - new Date();
      if (diff <= 0) {
        setNextNotificationCountdown("Soon!");
        clearInterval(countdownInterval);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setNextNotificationCountdown(`${h}h ${m}m ${s}s`);
      }
    }, 1000);

   
    const timer = setTimeout(() => {
      sendNotification();
      setInterval(sendNotification, 24 * 60 * 60 * 1000); // repeat daily
      clearInterval(countdownInterval);
    }, timeout);

    notificationTimerRef.current = timer;
    setNotificationSet(true);
  };

  
  useEffect(() => {
    if (notificationTime) {
      const [hour, minute] = notificationTime.split(":").map(Number);
      scheduleNotification(hour, minute);
    }
  }, [notificationTime, weather]);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  const formatDate = (date) =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getWeatherIcon = (main) => {
    switch (main.toLowerCase()) {
      case "clear": return <Sun className="w-16 h-16 text-yellow-400" />;
      case "clouds": return <Cloud className="w-16 h-16 text-gray-400" />;
      case "rain": return <CloudRain className="w-16 h-16 text-blue-400" />;
      case "snow": return <CloudSnow className="w-16 h-16 text-blue-200" />;
      default: return <Cloud className="w-16 h-16 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-purple-600 p-4">
      <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="bg-white/20 p-6 text-center text-white">
          <h1 className="text-2xl font-bold mb-2">WeatherPro</h1>
          <div className="text-sm opacity-90">
            <div className="font-mono text-lg">{formatTime(currentTime)}</div>
            <div className="text-xs mt-1">{formatDate(currentTime)}</div>
          </div>
        </div>

        
        <div className="p-6">
          {loading && <p className="text-white text-center text-lg">Fetching weather...</p>}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>}

          {weather && (
            <div className="space-y-6 text-white text-center">
              <div className="flex items-center justify-center mb-4">
                <MapPin className="w-5 h-5 mr-2"/>
                <span className="text-xl font-semibold">{weather.name}, NG</span>
              </div>
              <div className="flex justify-center mb-4">{getWeatherIcon(weather.weather[0].main)}</div>
              <div className="text-6xl font-bold mb-2">{Math.round(weather.main.temp)}°C</div>
              <div className="text-xl capitalize mb-4">{weather.weather[0].description}</div>
=
              {umbrellaMessage && (
                <div className="mt-2 bg-white/20 p-3 rounded-xl text-white font-semibold">
                  {umbrellaMessage}
                </div>
              )}

            
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Thermometer className="w-8 h-8 mx-auto mb-2 text-red-400"/>
                  <div className="text-sm opacity-75">Feels Like</div>
                  <div className="text-lg font-semibold">{Math.round(weather.main.feels_like)}°C</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Droplets className="w-8 h-8 mx-auto mb-2 text-blue-400"/>
                  <div className="text-sm opacity-75">Humidity</div>
                  <div className="text-lg font-semibold">{weather.main.humidity}%</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Wind className="w-8 h-8 mx-auto mb-2 text-gray-300"/>
                  <div className="text-sm opacity-75">Wind</div>
                  <div className="text-lg font-semibold">{weather.wind.speed} m/s {windDirection(weather.wind.deg)}</div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <Eye className="w-8 h-8 mx-auto mb-2 text-purple-300"/>
                  <div className="text-sm opacity-75">Visibility</div>
                  <div className="text-lg font-semibold">{(weather.visibility/1000).toFixed(1)} km</div>
                </div>
              </div>

              
              <div className="mt-6 bg-white/20 p-4 rounded-xl text-white text-center">
                <h2 className="font-semibold text-lg mb-2">Daily Notifications</h2>
                <p className="text-sm opacity-80 mb-2">
                  Choose a time to get daily weather updates:
                </p>
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(e) => setNotificationTime(e.target.value)}
                  className="rounded-lg p-2 text-black"
                />
                {notificationSet && (
                  <p className="mt-2 text-green-200 text-sm">
                    Notification scheduled at {notificationTime} ({nextNotificationCountdown} remaining)
                  </p>
                )}
                <button
                  onClick={() => {
                    if (weather) {
                      const message = needsUmbrella()
                        ? `🌂 It's raining today in ${weather.name}. Take your umbrella!`
                        : `☀️ No rain today in ${weather.name}.`;
                      if (Notification.permission === "granted") {
                        new Notification("Weather Update", { body: message });
                      }
                    }
                  }}
                  className="mt-2 bg-white/20 p-2 rounded-lg text-white hover:bg-white/30"
                >
                  Send Notification Now
                </button>
              </div>
            </div>
          )}

          {!weather && !loading && !error && (
            <div className="text-center text-white/80 py-12">
              <Cloud className="w-16 h-16 mx-auto mb-4 opacity-50"/>
              <p>Fetching your location weather...</p>
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
};

export default WeatherApp;