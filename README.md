Building And Deploying A Netflix Recommender System

Content Based Recommender System recommends movies similar to the movie user likes and analyses the sentiments on the reviews given by the user for that movie.

The details of the movies(title, genre, runtime, rating, poster, etc) are fetched using an API by TMDB, https://www.themoviedb.org/documentation/api, and using the IMDB id of the movie in the API.

We use web scraping to get the reviews given by the user in the IMDB site using beautifulsoup4 and performed sentiment analysis on those reviews.


Sources of the datasets 
IMDB 5000 Movie Dataset [https://www.kaggle.com/datasets/carolzhangdc/imdb-5000-movie-dataset](url)
The Movies Dataset [https://www.kaggle.com/datasets/rounakbanik/the-movies-dataset](url)
List of movies in 2018: [https://en.wikipedia.org/wiki/List_of_American_films_of_2018](url)
List of movies in 2019 [https://en.wikipedia.org/wiki/List_of_American_films_of_2019](url)
List of movies in 2020 [https://en.wikipedia.org/wiki/List_of_American_films_of_2020](url)
....
List of movies in 2025 [https://en.wikipedia.org/wiki/List_of_American_films_of_2025](url)
