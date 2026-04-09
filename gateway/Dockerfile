FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy the built jar from Gradle output
COPY app/build/libs/app-0.0.1-SNAPSHOT.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
