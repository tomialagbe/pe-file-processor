#### PE File Processor
This API accepts Portable-Executable (PE) files and saves them for future consumption

## Running the project
- Clone the repository
- Run this command from inside the pe-file-processor directory
````
docker-compose up
````

This starts up `redis` and the api server on port 8080

###### Making a request
To send a request to the accept-file app:
````
POST http://localhost:8080/pe-file
````
This endpoint requires a multipart file parameter named `peFile`
