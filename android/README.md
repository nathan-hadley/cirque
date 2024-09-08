# Android Local Dev Setup

## Configure Mapbox Downloads Token
1. Create a Mapbox account
2. From your account's tokens page, click the Create a token button.
3. From the token creation page, give your token a name and make sure the box next to the Downloads:Read scope is checked.
4. Click the Create token button at the bottom of the page to create your token. The token you've created is a secret token, which means you will only have one opportunity to copy it somewhere secure.
5. Find or create a `gradle.properties` file in your Gradle user home folder. The folder is located at `«USER_HOME»/.gradle`. Once you have found or created the file, its path should be `«USER_HOME»/.gradle/gradle.properties`.
6. Add your secret token your gradle.properties file: `MAPBOX_DOWNLOADS_TOKEN=YOUR_SECRET_MAPBOX_ACCESS_TOKEN`

## Run App
Open Android Studio, sync, and you should be good to go!

