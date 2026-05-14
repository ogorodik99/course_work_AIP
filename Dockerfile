FROM php:8.2-apache

# Включить mod_rewrite
RUN a2enmod rewrite

# Установить расширения
RUN docker-php-ext-install pdo pdo_mysql

# Установить рабочую директорию
WORKDIR /var/www/html

# Скопировать backend код
COPY backend/ .

# Установить права доступа
RUN chown -R www-data:www-data /var/www/html

# Exposing port 80
EXPOSE 80

# Запуск Apache
CMD ["apache2-foreground"]