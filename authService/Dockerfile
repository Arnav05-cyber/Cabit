# Use an official OpenJDK runtime as a parent image
FROM eclipse-temurin:17-jdk-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the build artifact (jar file) from your app/build/libs folder
# Note: Ensure you run './gradlew build' before running docker commands
COPY app/build/libs/app.jar app.jar

# Run the jar file
ENTRYPOINT ["java", "-jar", "app.jar"]