pipeline {
    agent any  // Use any available agent
    stages {
        stage('Build') {
            steps {
                // Shell commands to set up the environment, create a virtual environment, etc.
                sh 'python3 -m venv venv'
                sh 'source venv/bin/activate'
                sh 'pip install -r requirements.txt'
            }
        }
        stage('Test') {
            steps {
                // Run your unit tests
                sh 'python -m unittest discover'
            }
        }
        stage('Deploy') {
            steps {
                // For example, start the Flask app
                sh 'flask run'
            }
        }
    }
}
