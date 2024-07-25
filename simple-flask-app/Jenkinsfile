pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                // Checkout code from the Git repository
                git branch: 'main', url: 'https://github.com/Chanthuru2023/simple_flask_app.git'
            }
        }
        stage('Build') {
            steps {
                script {
                    // Build the Docker image
                    dockerImage = docker.build('simple-flask-app:latest')
                }
            }
        }
        stage('Test') {
            steps {
                script {
                    // Run tests inside the Docker container (if any)
                    dockerImage.inside {
                        sh 'echo "No tests available"'
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                // Run the Docker container
                sh 'docker run -d -p 5000:5000 simple-flask-app:latest'
            }
        }
    }
}
