# Node.js resmi image'ını temel alarak başla
FROM node:latest

# Gerekli paketleri ve araçları kur
RUN apt-get update \
    && apt-get install -y wget xvfb firefox-esr

# Geckodriver'ı indir ve kur
RUN wget -q "https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz" -O geckodriver.tar.gz \
    && tar -xzvf geckodriver.tar.gz \
    && mv geckodriver /usr/local/bin/geckodriver \
    && chmod +x /usr/local/bin/geckodriver \
    && rm geckodriver.tar.gz

# Çalışma dizinini ayarla
WORKDIR /usr/src/app

# Bağımlılıkları yükle
COPY package*.json ./
RUN npm install

# Uygulama kodunu kopyala
COPY . .

# Uygulamayı başlat
CMD [ "node", "index.js" ]
