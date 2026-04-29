pipeline {
    agent any

    environment {
        // Docker image tags
        BACKEND_IMAGE = "task-manager-backend"
        FRONTEND_IMAGE = "task-manager-frontend"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir('Backend') {
                            sh 'pip install -r requirements.txt --quiet'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir('Frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        dir('Backend') {
                            sh 'python -m py_compile app.py database.py models.py run.py || true'
                        }
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('Frontend') {
                            sh 'npm run lint || true'
                        }
                    }
                }
                stage('Frontend Build Test') {
                    steps {
                        dir('Frontend') {
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Build backend image
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Backend/Dockerfile Backend/"
                    // Build frontend image
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Frontend/Dockerfile Frontend/"
                }
            }
        }

        stage('Deploy to Render') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to Render...'
                echo 'To deploy manually:'
                echo '  1. Push to GitHub main branch'
                echo '  2. Render auto-deploys from GitHub (configured in Render Dashboard)'
                echo '  3. Vercel auto-deploys from GitHub (configured in Vercel Dashboard)'
                echo ''
                echo 'For Render API deployment, set RENDER_API_KEY and call:'
                echo '  curl -X POST https://api.render.com/v1/services/\\$RENDER_SERVICE_ID/deploys'
                echo '    -H "Authorization: Bearer \\$RENDER_API_KEY"'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the logs for  details.'
        }
        always {
            cleanWs()
        }
    }
}
