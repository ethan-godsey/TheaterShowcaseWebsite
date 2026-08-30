This repository was made for Ellie Evens, a musical theater student at 
Illinois Wesleyan University.

It was made utilizing a Vue 2 as well as Vuex rather than Pinia, something I am solidifying in my internship work. The server code is written in Typescript with the Node.js framework. 

I have used a slew of AWS tools to learn about production deployment outside of the CI/CD pipeline I have been exposed to in the corporate environment I work in. 

Among these managed services are Route 53, providing DNS from my Squarespace domain to a CloudFront domain. That CloudFront server uses Certificate Manager for TLS encryption.

 The authorization is dealt with a by Cognito Pool, allowing for admin priviliges that allow easy customization by Ellie. Files are stored in an S3 bucket, and the database for text based media is hosted on Neon in a Postgres DB.

 Most of these decisions were made in conjunction with what I know, with some preliminary guidance by Claude Code, of course followed by online research via the browser. 

 Notably, development was accelerated by AI, but I explicitly have been practicing the patterns seen in the repository rather than simply letting AI drive so that I can understand and customize the output to Ellie's liking.

 Features I am still looking to implement are AWS SES for contact forms to go straight to Ellie's email, audition tapes being bundeled to a custom URL for her to submit, and video hosting via Vimeo for her reels rather than trying to store those in a bucket.