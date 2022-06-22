# System components
Ubuntu (Digital Ocean droplet), Nodejs, MySQL, Nginx, Certbot

# Git repo
https://github.com/WarBuggy/mvpdispensary.git

# Config files
Config files are not included in git repo. They have to be created manually.

db/config.js
module.exports = {
    host: IP of database server,
    user: database user name,
    password: database password,
    initDB: 'mvpdispensary_data',
    port: 3306, // database port
    logParams: false, // print input params to console log or not
    logLogInfo: false, // print log info to console log or not
};

mailer/config.js
module.exports = {
    username: email address,
    password: app password for the email,
    sender: 'MVP Dispensary',
    sendFrom: email address,

    adminEmail: admin email,
    shopEmail: shop email,
};

payment/config.js
module.exports = {
    nowspayment: {
        apiKey: nowspayment API key,
        ipn: nowspayment IPN secret,
        ipn_callback_url: "https://capsulestudio.com.vn/api_mvpdispensary/invoice/update",
        success_url: "https://capsulestudio.com.vn/mvpdispensary/",
        cancel_url: "https://capsulestudio.com.vn/mvpdispensary/",
        partially_paid_url: "https://capsulestudio.com.vn/mvpdispensary/",

        otpLength: 6, // length of invoice OTP
        otpMinWaitInMinute: 5, // minimum time between OTP request from an IP address
        otpAvailableMinute: 30, // maximun time an OTP remains valid
    },
};

public/assets/js/backendURL.js
window.BACKEND_URL = 'https://capsulestudio.com.vn/api_mvpdispensary/';
window.FRONTEND_URL = 'https://capsulestudio.com.vn/mvpdispensary/';

# Database
Database structure can be import from file sql/structure.sql

# Nginx config
Create file /etc/nginx/sites-available/mvpsmoke.shop

server {
    server_name mvpsmoke.shop www.mvpsmoke.shop;
    root /home/hvb/mvpdispensary/public;
    index index.html home.html;

    location /api_mvpdispensary/ {
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Host $http_host;
        proxy_pass         http://localhost:9543;
    }
}

Then
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/mvpsmoke.shop

# https with certbot
Follow the instruction on this link
https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04

# mvpdispensary