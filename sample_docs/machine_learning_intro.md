# Introduction to Machine Learning

## Chapter 1: What is Machine Learning?

Machine learning (ML) is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.

The process of learning begins with observations or data, such as examples, direct experience, or instruction, in order to look for patterns in data and make better decisions in the future based on the examples that we provide. The primary aim is to allow the computers to learn automatically without human intervention or assistance and adjust actions accordingly.

## Chapter 2: Types of Machine Learning

### Supervised Learning
Supervised learning is where you have input variables (X) and an output variable (Y) and you use an algorithm to learn the mapping function from the input to the output: Y = f(X). The goal is to approximate the mapping function so well that when you have new input data (X), you can predict the output variables (Y) for that data. Common algorithms include linear regression, decision trees, and neural networks.

### Unsupervised Learning
Unsupervised learning is where you only have input data (X) and no corresponding output variables. The goal for unsupervised learning is to model the underlying structure or distribution in the data in order to learn more about the data. These are called unsupervised learning because there is no correct answers and there is no teacher. Algorithms include clustering (K-means, hierarchical), and dimensionality reduction (PCA, t-SNE).

### Reinforcement Learning
Reinforcement learning is about taking suitable action to maximize reward in a particular situation. It differs from supervised learning in that there is no labeled data; the agent learns by trial and error. The agent receives rewards by performing correctly and penalties for performing incorrectly. The agent aims to maximize the total reward. Q-learning and Deep Q-Networks (DQN) are popular algorithms.

## Chapter 3: Neural Networks

A neural network is a series of algorithms that endeavors to recognize underlying relationships in a set of data through a process that mimics the way the human brain operates. Neural networks can adapt to changing input so the network generates the best possible result without needing to redesign the output criteria.

### Architecture
- **Input Layer**: Receives the raw data
- **Hidden Layers**: Perform computations and feature extraction
- **Output Layer**: Produces the final prediction

### Deep Learning
Deep learning is a subset of machine learning where artificial neural networks with multiple layers (deep neural networks) learn from large amounts of data. Deep learning has driven advances in image recognition, natural language processing, and autonomous vehicles. Popular architectures include CNNs for images, RNNs/LSTMs for sequences, and Transformers for language.

## Chapter 4: Model Evaluation

Model evaluation metrics help us understand how well our model performs:

- **Accuracy**: The ratio of correctly predicted observations to total observations
- **Precision**: The ratio of correctly predicted positive observations to total predicted positive observations
- **Recall**: The ratio of correctly predicted positive observations to all observations in the actual class
- **F1 Score**: The weighted average of Precision and Recall
- **ROC-AUC**: Measures the ability of the model to distinguish between classes

Cross-validation is essential for reliable evaluation, where the dataset is split into k folds and the model is trained and evaluated k times.
