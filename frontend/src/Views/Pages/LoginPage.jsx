import React, { Component } from 'react';
// import Login from '../authentication/Login_material';
// import theme from '../themes';
// import { ThemeProvider } from '@mui/material/styles';

class LoginPage extends Component {
    state = {  } 
    render() {
        return(<h1>Hello World from Login Page</h1>); 
        // return (
        //     <>
        //       {/*  An example image is provided. Please use a royalty-free photo, a photo owned by you, or a photo owned by the CIC */}
        //       <Grid
        //         container
        //         className={classes.centerBox}
        //         style={
        //           type === 'image'
        //             ? themeColor === 'standard'
        //               ? {
        //                   backgroundColor: '#012144',
        //                   backgroundImage: 'url(./assets/images/background.jpg)',
        //                   backgroundSize: 'cover',
        //                   backgroundRepeat: 'no',
        //                   width: '100%',
        //                   height: '100vh',
        //                 }
        //               : {
        //                   backgroundColor: themeColor,
        //                   backgroundImage: 'url(./assets/images/background.jpg)',
        //                   backgroundSize: 'cover',
        //                   backgroundRepeat: 'no',
        //                   width: '100%',
        //                   height: '100vh',
        //                 }
        //             : themeColor === 'standard'
        //             ? { backgroundColor: '#012144', width: '100%', height: '100vh' }
        //             : { backgroundColor: themeColor, width: '100%', height: '100vh' }
        //         }
        //       >
        //         {/* Please use a royalty free video or a video that you or the CIC owns */}
        //         {type === 'video' ? (
        //           <video playsInline autoPlay muted loop>
        //             <source
        //               src={process.env.PUBLIC_URL + '/Assets/Videos/video.mp4'}
        //               type="video/mp4"
        //             />
        //           </video>
        //         ) : null}
        //         <Grid
        //           container
        //           item
        //           xs={12}
        //           md={6}
        //           className={`page-info ${classes.centerBox}`}
        //         >
        //           <Grid
        //             container
        //             item
        //             justifyContent={'space-evenly'}
        //             alignItems={'center'} /*style={{height: "60vh"}}*/
        //           >
        //             <Grid xs item className={`typewriter ${classes.marginHorizontal}`}>
        //               <p
        //                 className={`${classes.textAlignCenter} ${
        //                   animateTitle
        //                     ? darkMode
        //                       ? 'line anim-typewriter'
        //                       : 'line anim-typewriter-light lightMode'
        //                     : darkMode
        //                     ? 'line-static'
        //                     : 'line-static lightMode-static'
        //                 }`}
        //               >
        //                 {title}
        //               </p>
        //             </Grid>
        //           </Grid>
        //         </Grid>
        //         <Grid
        //           container
        //           item
        //           xs={12}
        //           sm={7}
        //           md={5}
        //           className={`login-container ${classes.centerBox}`}
        //         >
        //           <Grid
        //             container
        //             item
        //             direction={'column'}
        //             xs={12}
        //             sm={11}
        //             md={9}
        //             className={'login-box'}
        //           >
        //             <Grid className={'login-wrapper-top'}>
        //               <span className={'login-wrapper-top-header'}>
        //                 {loginState === 'signIn' ? (
        //                   <span>Sign In</span>
        //                 ) : loginState === 'signUp' ? (
        //                   <span>Create an Account</span>
        //                 ) : loginState === 'confirmSignUp' ? (
        //                   <span>Verify Account</span>
        //                 ) : loginState === 'forgotPassword' ? (
        //                   <span>Forgot your password?</span>
        //                 ) : loginState === 'resetPassword' ? (
        //                   <span>Password Reset</span>
        //                 ) : loginState === 'newUserPassword' ? (
        //                   <span>Set New Password</span>
        //                 ) : (
        //                   <span>Welcome</span>
        //                 )}
        //               </span>
        //             </Grid>
        //             {loginState === 'signIn' && (
        //               <Grid>
        //                 <Snackbar
        //                   autoHideDuration={2000}
        //                   anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        //                   open={showSuccessAlert}
        //                   message="Success! Redirecting you to sign in page"
        //                   onClose={() => setShowSuccessAlert(false)}
        //                 />
        //                 <BannerMessage type={'error'} typeCheck={accountLoginError}>
        //                   Incorrect username or password.
        //                 </BannerMessage>
        //                 {/* username */}
        //                 <TextFieldStartAdornment
        //                   startIcon={<AlternateEmail />}
        //                   placeholder={'Email'}
        //                   name={'email'}
        //                   type={'email'}
        //                   onChange={onChange}
        //                 />
        //                 {/* password */}
        //                 <TextFieldStartAdornment
        //                   startIcon={<Lock />}
        //                   placeholder={'Password'}
        //                   name={'password'}
        //                   type={'password'}
        //                   onChange={onChange}
        //                 />
        //                 <Grid
        //                   className={`${classes.flexDisplay} ${classes.forgetPassword} ${classes.cursor}`}
        //                   onClick={() => resetStates('forgotPassword')}
        //                 >
        //                   {' '}
        //                   {/* forget */}
        //                   <span style={{ textAlign: 'end' }}>
        //                     Forgot your password?
        //                   </span>
        //                 </Grid>
        //                 <Grid className={`input-box ${classes.marginTop}`}>
        //                   {' '}
        //                   {/* sign in button */}
        //                   <SubmitButtonWithLoading
        //                     submitAction={signIn}
        //                     submitMessage={'Sign In'}
        //                     loadingState={loading}
        //                   />
        //                 </Grid>
        //                 {!disableSignUp && ( // if sign up is not disabled, then show the create an account option
        //                   <div>
        //                     {/* divider */}
        //                     <Grid container item alignItems="center" xs={12}>
        //                       <Grid item xs>
        //                         <Divider />
        //                       </Grid>
        //                       <Grid item className={classes.padding}>
        //                         Or
        //                       </Grid>
        //                       <Grid item xs>
        //                         <Divider />
        //                       </Grid>
        //                     </Grid>
        //                     {/* create an account button */}
        //                     <Grid className={`input-box`}>
        //                       <DefaultButton
        //                         variant="contained"
        //                         type="button"
        //                         onClick={() => resetStates('signUp')}
        //                       >
        //                         Create an Account
        //                       </DefaultButton>
        //                     </Grid>
        //                   </div>
        //                 )}
        //               </Grid>
        //             )}
        //             {loginState === 'forgotPassword' && (
        //               <Grid>
        //                 <Grid container item xs={12}>
        //                   <span>
        //                     Enter your email address and we'll send you a code to help
        //                     you reset your password.
        //                   </span>
        //                 </Grid>
        //                 <TextFieldStartAdornment
        //                   startIcon={<AlternateEmail />}
        //                   placeholder={'Email'}
        //                   name={'email'}
        //                   type="email"
        //                   autoComplete={'new-password'}
        //                   variant="outlined"
        //                   error={forgotPasswordError}
        //                   onChange={onChange}
        //                 />
        //                 {!!forgotPasswordError && (
        //                   <Grid container item xs={12} className={classes.errorMessage}>
        //                     <span>
        //                       Please enter a valid email or create an account&nbsp;
        //                       <span
        //                         className={`${classes.cursor} ${classes.underlineText}`}
        //                         onClick={() => updateLoginState('signUp')}
        //                       >
        //                         <strong>here</strong>
        //                       </span>
        //                       <span>.</span>
        //                     </span>
        //                   </Grid>
        //                 )}
        //                 <BackAndSubmitButtons
        //                   backAction={() => resetStates('signIn')}
        //                   submitAction={forgotPassword}
        //                   submitMessage={'Send reset code'}
        //                   loadingState={loading}
        //                 />
        //               </Grid>
        //             )}
        //             {loginState === 'resetPassword' && (
        //               <Grid>
        //                 <Grid>
        //                   <span>
        //                     Please check your email&nbsp;
        //                     <strong>{formState.email}</strong>
        //                     <br />
        //                     for a reset code and create a new password.
        //                   </span>
        //                 </Grid>
        //                 <BannerMessage
        //                   type={'error'}
        //                   typeCheck={emptyInputError || timeLimitError}
        //                 >
        //                   {(!!emptyInputError && 'Please fill in all fields.') ||
        //                     (timeLimitError !== '' && timeLimitError)}
        //                 </BannerMessage>
        //                 <TextFieldStartAdornment
        //                   startIcon={<Dialpad />}
        //                   placeholder="Enter reset code"
        //                   variant="outlined"
        //                   name={'resetCode'}
        //                   type="text"
        //                   error={verificationError}
        //                   helperText={
        //                     !!verificationError && 'Please enter correct reset code.'
        //                   }
        //                   onChange={onChange}
        //                 />
        //                 <TextFieldStartAdornment
        //                   startIcon={<Lock />}
        //                   placeholder="Create new password"
        //                   name={'password'}
        //                   type="password"
        //                   error={newPasswordError}
        //                   helperText={'Your password must have the following:'}
        //                   autoComplete={'new-password'}
        //                   onChange={onChangePassword}
        //                 />
        //                 <Grid
        //                   container
        //                   item
        //                   xs={12}
        //                   className={!!newPasswordError ? classes.passwordReq : null}
        //                 >
        //                   <PasswordRequirements requirements={passwordRequirements} />
        //                 </Grid>
        //                 <TextFieldStartAdornment
        //                   startIcon={<Lock />}
        //                   placeholder="Re-enter the password"
        //                   name={'confirm-password'}
        //                   type="password"
        //                   error={passwordUnmatchError}
        //                   helperText={
        //                     !!passwordUnmatchError && 'Passwords do not match'
        //                   }
        //                   autoComplete={'new-password'}
        //                   value={confirmPasswordString}
        //                   onChange={(e) => {
        //                     setConfirmPasswordString(e.target.value); // update current input state
        //                     // check if "password" is the same as "confirm-password"
        //                     e.target.value === formState.password
        //                       ? setPasswordUnmatchError(false)
        //                       : setPasswordUnmatchError(true);
        //                   }}
        //                 />
        //                 <BackAndSubmitButtons
        //                   backAction={() => resetStates('signIn')}
        //                   submitAction={resetPassword}
        //                   submitMessage={'Update Password'}
        //                   loadingState={loading}
        //                 />
        //               </Grid>
        //             )}
        //             {loginState === 'signUp' && (
        //               <Grid>
        //                 <BannerMessage type={'error'} typeCheck={emptyInputError}>
        //                   Please fill in all fields.
        //                 </BannerMessage>
        //                 <TextFieldStartAdornment
        //                   startIcon={false}
        //                   label={'Name'}
        //                   name={'name'}
        //                   type="text"
        //                   autoComplete={'new-password'}
        //                   onChange={onChange}
        //                 />
        //                 <TextFieldStartAdornment
        //                   startIcon={false}
        //                   label={'Username'}
        //                   name={'preferred_username'}
        //                   type="text"
        //                   autoComplete={'new-password'}
        //                   onChange={onChange}
        //                 />
        //                 <TextFieldStartAdornment
        //                   startIcon={false}
        //                   label={'Email'}
        //                   name={'email'}
        //                   type="email"
        //                   autoComplete={'new-password'}
        //                   error={accountCreationEmailExistError || invalidEmailError}
        //                   helperText={
        //                     (!!accountCreationEmailExistError &&
        //                       'An account with the given email already exists.') ||
        //                     (!!invalidEmailError && 'Please enter a valid email.')
        //                   }
        //                   onChange={onChange}
        //                 />
        //                 <TextFieldStartAdornment
        //                   startIcon={false}
        //                   label={'Password'}
        //                   name={'password'}
        //                   type="password"
        //                   error={accountCreationPasswordError}
        //                   helperText={'Your password must have the following:'}
        //                   autoComplete={'new-password'}
        //                   onChange={onChangePassword}
        //                 />
        //                 <Grid
        //                   container
        //                   item
        //                   xs={12}
        //                   className={
        //                     !!accountCreationPasswordError ? classes.passwordReq : null
        //                   }
        //                 >
        //                   <PasswordRequirements requirements={passwordRequirements} />
        //                 </Grid>
        //                 <TextFieldStartAdornment
        //                   startIcon={false}
        //                   label={'Confirm Password'}
        //                   name={'confirm-password'}
        //                   type="password"
        //                   error={passwordUnmatchError}
        //                   helperText={
        //                     !!passwordUnmatchError && 'Passwords do not match'
        //                   }
        //                   autoComplete={'new-password'}
        //                   value={confirmPasswordString}
        //                   onChange={(e) => {
        //                     setConfirmPasswordString(e.target.value); // update current input state
        //                     // check if "password" is the same as "confirm-password"
        //                     e.target.value === formState.password
        //                       ? setPasswordUnmatchError(false)
        //                       : setPasswordUnmatchError(true);
        //                   }}
        //                 />
        //                 <BackAndSubmitButtons
        //                   backAction={() => resetStates('signIn')}
        //                   submitAction={signUp}
        //                   submitMessage={'Sign Up'}
        //                   loadingState={loading}
        //                 />
        //               </Grid>
        //             )}
        //             {loginState === 'confirmSignUp' && (
        //               <Grid>
        //                 <Grid container item xs={12}>
        //                   <span>
        //                     Please check your email for a confirmation code. This may
        //                     take several minutes.
        //                   </span>
        //                 </Grid>
        //                 <BannerMessage type={'error'} typeCheck={verificationError}>
        //                   Invalid verification code provided, please try again.
        //                 </BannerMessage>
        //                 <BannerMessage type={'error'} typeCheck={timeLimitError !== ''}>
        //                   {timeLimitError}
        //                 </BannerMessage>
        //                 <BannerMessage type={'success'} typeCheck={newVerification}>
        //                   New verification code sent successfully.
        //                 </BannerMessage>
        //                 <Grid
        //                   container
        //                   item
        //                   direction={'column'}
        //                   xs={12}
        //                   className={'input-box'}
        //                 >
        //                   <TextFieldStartAdornment
        //                     startIcon={<Dialpad />}
        //                     placeholder="Enter your confirmation code."
        //                     name={'authCode'}
        //                     type="text"
        //                     autoComplete={'new-password'}
        //                     onChange={onChange}
        //                   />
        //                 </Grid>
        //                 <Grid>
        //                   <span>Didn't receive your verification code?</span>
        //                   <Button onClick={resendConfirmationCode}>
        //                     <span className={classes.underlineText}>Resend Code</span>
        //                   </Button>
        //                 </Grid>
        //                 <BackAndSubmitButtons
        //                   backAction={() => resetStates('signUp')}
        //                   submitAction={confirmSignUp}
        //                   submitMessage={'Verify'}
        //                   loadingState={loading}
        //                 />
        //               </Grid>
        //             )}
        //             {loginState === 'newUserPassword' && (
        //               <Grid>
        //                 <Grid container item xs={12}>
        //                   <span>
        //                     Please replace your temporary password with a new password
        //                     for <strong>{formState.email}</strong>.
        //                   </span>
        //                 </Grid>
        //                 <BannerMessage type={'error'} typeCheck={timeLimitError !== ''}>
        //                   {timeLimitError}
        //                 </BannerMessage>
        //                 <Grid className={`input-box`}>
        //                   <TextFieldStartAdornment
        //                     startIcon={false}
        //                     placeholder={'Enter new password'}
        //                     label={'Password'}
        //                     name={'password'}
        //                     type="password"
        //                     autoComplete={'new-password'}
        //                     error={newPasswordError || emptyInputError}
        //                     helperText={'Your password must have the following:'}
        //                     onChange={onChangePassword}
        //                   />
        //                   <Grid
        //                     container
        //                     item
        //                     xs={12}
        //                     className={
        //                       !!newPasswordError || !!emptyInputError
        //                         ? classes.passwordReq
        //                         : null
        //                     }
        //                   >
        //                     <PasswordRequirements requirements={passwordRequirements} />
        //                   </Grid>
        //                   <TextFieldStartAdornment
        //                     startIcon={false}
        //                     placeholder={'Re-enter new password'}
        //                     label={'Confirm Password'}
        //                     name={'confirm-password'}
        //                     type="password"
        //                     error={passwordUnmatchError}
        //                     helperText={
        //                       !!passwordUnmatchError && 'Passwords do not match'
        //                     }
        //                     autoComplete={'new-password'}
        //                     value={confirmPasswordString}
        //                     onChange={(e) => {
        //                       setConfirmPasswordString(e.target.value); // update current input state
        //                       // check if "password" is the same as "confirm-password"
        //                       e.target.value === formState.password
        //                         ? setPasswordUnmatchError(false)
        //                         : setPasswordUnmatchError(true);
        //                     }}
        //                   />
        //                 </Grid>
        //                 <BackAndSubmitButtons
        //                   backAction={() => resetStates('signIn')}
        //                   submitAction={setNewPassword}
        //                   submitMessage={'Set Password'}
        //                   loadingState={loading}
        //                 />
        //               </Grid>
        //             )}
        //           </Grid>
        //         </Grid>
        //       </Grid>
        //     </>
        // );
    }
}
 
export default LoginPage;