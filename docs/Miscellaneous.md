# Miscellaneous Information

### How to Change the Displayed App Name
There are two locations where the app name is displayed:

- Login page
  - To change the name displayed on the login page, navigate to `frontend/src/App.js` and change the `title` property.    

- Navigation bar
  - To change the name displayed on the navigation bar, navigate to `frontend/src/Components/Navbar/Navbar.js` and change the name in the return statement of the `Navbar` function.

### `public` folder in S3 bucket
AWS Amplify automatically generates a filepath prefix, which by default is named `public`. 

E.g., filepath WITHOUT prefix: `UBCO/2023/syllabus.pdf` 

E.g., filepath WITH prefix: `public/UBCO/2023/syllabus.pdf` 

The folder named `public` in the S3 bucket is created to simply match the generated filepath. The S3 bucket, including content within the `public` folder, is not publicly accessible. 

### VPC CIDR Range

The CIDR range configured in the Vpc-Stack is `10.0.0.0/16` and is also the default range that AWS will set for any Vpc. This values could be overwritten in the future
at your chosen.
