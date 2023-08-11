import * as dotenv from 'dotenv'
dotenv.config()

import express from "express";
import { PrismaClient } from "@prisma/client";
import morgan from "morgan";
import cors from "cors";

import { auth } from  'express-oauth2-jwt-bearer'

const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));


app.get("/ping", (req, res) => {
    res.send("pong");
});

const prisma = new PrismaClient();

app.get("/profile/:email", async (req, res) => {
  const email = req.params.email;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found");
  }
});

app.get("/users/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (user) {
    res.json(user);
  } else {
    res.status(404).send("User not found");
  }
});


// retrieve all cards
app.get('/cards', async (req, res) => {
  try {
    const cards = await prisma.card.findMany();
    res.status(200).json(cards);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get("/reviews", async (req, res) => {
  const reviews = await prisma.ReviewsList.findMany();
  res.status(200).json(reviews);
});

app.get("/movies", async (req, res) => {
  const movies = await prisma.Movie.findMany();
  res.status(200).json(movies);
});

app.get("/movies/:movieId", async (req, res) => {
  const movieId = parseInt(req.params.movieId);

  try {
    const movie = await prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });

    if (movie) {
      res.status(200).json(movie);
    } else {
      res.status(404).json({ message: "Movie not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});



// GET: Get reviews by user email
app.get("/reviews/:email", async (req, res) => {
  const email = req.params.email;
  const reviews = await prisma.ReviewsList.findMany({
    where: {
      contributor: {
        email: email,
      },
    },
  });

  if (reviews.length > 0) {
    res.status(200).json(reviews);
  } else {
    res.status(404).send("No reviews found for the this email");
  }
});

app.get("/movies/:id/reviews", async (req, res) => {
  const movieId = parseInt(req.params.id);
  const reviews = await prisma.ReviewsList.findMany({
    where: {
      movie: {
        id: movieId,
      },
    },
    include: {
      contributor: true,
    },
  });

  res.status(200).json(reviews);
});


app.post("/movies", async (req, res) => {
  const { title, releaseYear } = req.body;
  if (title && releaseYear) {
    const movie = await prisma.Movie.create({
      data: {
        title,
        releaseYear,
      },
    });
    res.status(201).json(movie);
  } else {
    res.status(400).send("Bad request");
  }
});

app.post("/reviews", async (req, res) => {
  const { rating, comment, contributorID, movieId } = req.body;
  if (rating && comment && contributorID && movieId) {
    const review = await prisma.ReviewsList.create({
      data: {
        rating,
        comment,
        completed: false,
        contributor: { connect: { id: contributorID } },
        movie: { connect: { id: movieId } },
      },
    });
    res.status(201).json(review);
  } else {
    res.status(400).send("Bad request");
  }
});

app.post("/users", async (req, res) => {
  const { email, name } = req.body;
  if (email) {
    try {
      const user = await prisma.user.create({
        data: {
          email,
          name,
        },
      });
      res.status(201).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(400).send("Bad Request");
  }
});

app.patch("/profile/:email", async (req, res) => {
  const email = req.params.email;
  const { name } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: {
        email,
      },
      data: {
        name,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


app.put("/reviews/:id", async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment || !id) {
    res.status(400).send("Incorrect input values");
  } else {
    const existingReview = await prisma.ReviewsList.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingReview) {
      res.status(404).send(`Review ID ${id} not found`);
    } else {
      const updatedReview = await prisma.ReviewsList.update({
        where: { id: parseInt(id) },
        data: { rating, comment, completed: true },
      });

      res.json(updatedReview);
    }
  }
});


app.delete("/reviews/:id", async (req, res) => {
  const { id } = req.params;

  if (id) {
    const deletedReview = await prisma.ReviewsList.delete({
      where: { id: parseInt(id) },
    });

    if (deletedReview) {
      res.json(deletedReview);
    } else {
      res.status(404).send(`Review ID ${id} not found`);
    }
  } else {
    res.status(400).send("Bad request");
  }
});


app.get("/me", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;

  const user = await prisma.user.findUnique({
    where: {
      auth0Id,
    },
  });

  res.json(user);
});

// verify user status, if not registered in our database we will create it
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
/*       email, */
      auth0Id,
    },
  });

  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email,
        auth0Id,
        name,
      },
    });

    res.json(newUser);
  }
});

// Starts HTTP Server
app.listen(8000, () => {
    console.log("Server running on http://localhost:8000 🎉 🚀");
});
