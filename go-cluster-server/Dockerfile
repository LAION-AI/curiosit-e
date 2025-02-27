FROM golang:1.22-alpine

WORKDIR /app

COPY . .

RUN go build -o main .

EXPOSE 8081

CMD ["./main"] 