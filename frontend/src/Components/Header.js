import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

function ResponsiveAppBar() {
  {/* List of tabs for the header */}
  const pages = ['dashboard', 'courses', 'settings'];

  return (
    <AppBar sx={{ bgcolor: "#91BAD6", boxShadow: "0px 0px 0px 0px", maxHeight: 80}} position="static">
      <Container maxWidth={false} disableGutters={true}>
        <Toolbar>
          <Box>
            {pages.map((page) => (
              /* Creates a URL path and button for each page */
              <Link to={"/"+page.toLowerCase()}>
                <Button
                key={page}
                sx={{my: 0, color: 'black'}}
                >
                <h3>{page}</h3>
                </Button>
              </Link>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function HeaderTitle(){
  return(
    <Container maxWidth={false}>
            <Box>
                <Typography sx={{ my: -2}} align = 'left'>
                    <h1>Course Flexibility Dashboard</h1>
                </Typography>
            </Box>
        </Container>
  );
}

export default function Header(){
    return (
            <Box>
                <HeaderTitle />
                <ResponsiveAppBar />
            </Box>
    );
}
