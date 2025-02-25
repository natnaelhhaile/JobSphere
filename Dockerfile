# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Install Python, pip, and build dependencies
RUN apk add --no-cache python3 py3-pip gcc musl-dev libc-dev openblas-dev

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Install Python dependencies inside a virtual environment
RUN python3 -m venv /venv
RUN /venv/bin/pip install --upgrade pip
COPY requirements.txt ./
RUN /venv/bin/pip install -U -r requirements.txt

# Expose the port the app runs on
EXPOSE 3000

# Command to run the app (using the virtual environment's Python and Node.js)
CMD ["/bin/sh", "-c", "source /venv/bin/activate && node app.js"]
