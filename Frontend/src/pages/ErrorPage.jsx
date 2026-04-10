import { useRouteError, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

export default function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  console.error('Router error:', error);

  // Extract error details
  const status = error?.status || error?.statusCode || 500;
  const statusText = error?.statusText || error?.message || 'Unknown Error';
  const data = error?.data || error?.response?.data || error;
  const stack = error?.stack;

  // Determine error type and user-friendly message
  let errorTitle = 'Something went wrong';
  let errorMessage = 'An unexpected error occurred. Please try again later.';
  let severity = 'error';
  let IconComponent = ErrorOutlineIcon;

  if (status === 404) {
    errorTitle = 'Page Not Found';
    errorMessage =
      'The page you are looking for does not exist or has been moved.';
    severity = 'warning';
    IconComponent = WarningIcon;
  } else if (status === 401 || status === 403) {
    errorTitle = 'Access Denied';
    errorMessage = 'You do not have permission to access this resource.';
    severity = 'warning';
    IconComponent = WarningIcon;
  } else if (status === 500) {
    errorTitle = 'Server Error';
    errorMessage =
      'An internal server error occurred. Our team has been notified.';
    severity = 'error';
    IconComponent = ErrorOutlineIcon;
  } else if (status >= 400 && status < 500) {
    errorTitle = 'Client Error';
    errorMessage =
      'There was a problem with your request. Please check and try again.';
    severity = 'info';
    IconComponent = InfoIcon;
  }

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconComponent sx={{ fontSize: 60, color: `${severity}.main` }} />
            <Typography variant="h3" component="h1" fontWeight="bold">
              {errorTitle}
            </Typography>
          </Box>

          <Alert severity={severity} sx={{ width: '100%' }}>
            <Typography variant="body1">{errorMessage}</Typography>
          </Alert>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Error Code: {status}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {statusText}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{ px: 4 }}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{ px: 4 }}
            >
              Go Home
            </Button>
          </Box>

          {(data || stack) && (
            <Box sx={{ width: '100%', mt: 4 }}>
              <Accordion expanded={expanded} onChange={handleExpand}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" fontWeight="medium">
                    Technical Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {data && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight="medium"
                          gutterBottom
                        >
                          Error Data:
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, bgcolor: 'grey.50' }}
                        >
                          <pre
                            style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              overflow: 'auto',
                            }}
                          >
                            {typeof data === 'object'
                              ? JSON.stringify(data, null, 2)
                              : String(data)}
                          </pre>
                        </Paper>
                      </Box>
                    )}
                    {stack && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          fontWeight="medium"
                          gutterBottom
                        >
                          Stack Trace:
                        </Typography>
                        <Paper
                          variant="outlined"
                          sx={{ p: 2, bgcolor: 'grey.50' }}
                        >
                          <pre
                            style={{
                              margin: 0,
                              fontSize: '0.75rem',
                              overflow: 'auto',
                            }}
                          >
                            {stack}
                          </pre>
                        </Paper>
                      </Box>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
