# CNnetwork
## 1. index.js

``` Javascript
    app.use(session({
    store: new FileStore({
        retries   : 0, // new option to prevent [ENOENT: no such file or directory, open 'sessions/.json'] error. it seems that "retries" option prevent "drop" in router, but not necessary in localhost system.
        path: "./sessions"}),  // Specify the path to store session data
    secret: "secret!@#$%^&*()",  // Secret key for session encryption
    cookie: {expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)},   // Session expiration time
    resave : true, // prevent resave warning.
    saveUninitialized: true, // prevent saveUnitialized warning.
    }));
```

먼저 이 부분을 조금 수정하였습니다. [ENOENT: no such file or directory, open 'sessions/.json'] error가 발생해서입니다.
이 에러는 session.destroy()할 때 발생하는데, 이미 지워진 세션 값을 참조할 때 나타나는 에러입니다.
여러 가지 방법을 고민해본 결과 제 추측으로는, host에서 여러 번의 삭제 메시지를 보내는 것 같고, 그 중 첫 번째 메시지가 server에 
도달하면 세션 파일이 바로 삭제가 되므로, 이후 도착한 delte message들은 오류를 뱉어내는 것 같습니다. 따라서 retries : 0 을 넣어주어서 한 번씩만 메시지를 보내도록
수정하였습니다. 또한 resave : true 와 saveuninitialized: true는 default 값인데 terminal에서 warning이 뜨길래 그냥 넣어주었습니다.

```Javascript
    app.get("/", (req, res) =>
    {
        return res.redirect("/login");
        // <Your codes here>
    });
```

처음 들어가면 "/login"으로 보내도록 구성했습니다.
redirect와 render의 주요한 차이는, redirect는 해당하는 URL로 이동하고, render는 ejs(html, 템플릿)을 가져온다는 것입니다.


```Javascript
    app.get("/login", (req,res) =>// Your codes here (a line indicating the path of the GET request)
    {
        // If a user is logged in, redirect to the "/profile" page.
        if (req.session.user)
        {
            return res.redirect("/profile");
            // <Your codes here>
        }

        // Display the login page.
        // Hint: Use the render() function.
        return res.render("login-page");
        // <Your codes here>
    });
```

다음은 /login으로 보내진 이후의 명령에 대해서입니다. 우선 login이 필요없는 경우부터 
살핍니다. 즉, 이미 로그인되어있다면, "/profile"로 redirect시키고, 반면 그렇지 않다면 
"login-page.ejs"파일을 res.render()를 통해 client에게 보여줍니다.


이후는 app.post("/login")에 대해서입니다.


    // Extract the userId and password entered by the user from the body of the POST request.
    const {userId, password} = req.body;

    // Search for a user matching userId in the test accounts list.
    const user = testIds.find(user => user.userId === userId);

지금부터는 편의상 반존대로 진행하겠습니다. ^^

지금부터는 post 부분이므로 req에서는 id와 password가 존재할 것이다. 따라서,
이를 const로 저장해 둔다.
이후 testIds에서 userId가 일치하는 user를 저장해 둔다.

    if (!user)
    {
        // Display a login failure pop-up and redirect to the "/login" page.
        res.writeHead(401, {"Content-Type": "text/html; charset=utf-8"});

        res.write(`
            <script>
                window.onload = function() {
                    alert("Login failed!");
                    window.location.href = "/login";
                };
            </script>`);

        res.end();
        return;
    }

먼저 userId에 해당하는 user 자체가 없는 경우이다. 이 경우에는 error message를 발생시키고 login page로 redirect시킨다.

    if (password !== user.password)
    {
        // Display a login failure pop-up and redirect to the "/login" page.
        res.writeHead(401, {"Content-Type": "text/html; charset=utf-8"});

        // <Your codes here> (For redirecting to the login page)
        res.write(`
            <script>
                window.onload = function() {
                    alert("Login failed!");
                    window.location.href = "/login";
                };
            </script>`);
        
        res.end();
        return;
    }

다음으로 password가 틀린 경우이다. testids file에는 user의 id와 password가 모두 저장되어 있으므로 만약 password가 틀린다면 역시 error처리해준다.

    req.session.user = {userId: user.userId};

    // Display a login success pop-up and redirect to the "/profile" page.
    // Hint: Unlike the 401 code used in the case of failure, 200 code should be used.
    
    // <Your codes here>

    res.writeHead(200, {"Content-Type": "text/html; charset=utf-8"});
   
    res.write(`
        <script>
            window.onload = function() {
                alert("Login succeeded!");
                window.location.href = "/profile";
            };
        </script>`);

    res.end();
    return;

 위 두개의 분기에 빠지지 않는다면 로그인에 성공했으므로, req.session 파일에 userId를 저장해 둔다. 이때 저장된 user 정보는 profile-page-ejs에서 렌더링되는 정보를 넘겨주는 역할에 이용되므로 이 과정은 중요하다. 


```Javascript
    // When a GET request is received through the "/logout" path
    app.get("/logout", (req, res) =>
    {
        // Delete the current user's session information and redirect to the "/login" page.
        // Hint: Use req.session.destory() function for deleting the session information.

        // <Your codes here>
        if(req.session){ // if there is req.session-> destroy.(for exception)
            req.session.destroy();
        }
        res.redirect("/");
        return;
    });
```

 다음으로 logout 버튼을 눌렀을 경우이다. 이때는 session정보를 destory해야 한다. 그래야 login을 할때 profile로 redirect되지 않을 것이기 때문이다. 이때 req.session이 없다면 굳이 destory할 것이 없으므로 예외 처리를 해둔다.

```Javascript
    app.get("/profile", requireLogin, (req, res) =>
{
    // Extract the current user's information from the session information.
    // Hint: Use the function of req.session.user.
    // And refer to the part "Search for a user matching userId in the test accounts list" above.
    
    // <Your codes here>
    function findUser(element) {//argument is testIds array.
        const userId = req.session.user.userId;
        for (i=0;i<element.length;i++){//loop for array
            if(element[i].userId === userId){ //if userid is searched
                return [element[i].userName, element[i].classNumber, element[i].photo]; //return [name,number,photo]
            }
        }
        // do not need for exception process because middleware checked the request.
    }
    const arr= findUser(testIds);
    // Display the profile page and forward the user information(name, student number, photo).
    // Hint: It is delivered in the form of json file, and the check the variable names of the necessary information in the testIds.js.
    // For example, the "name" is specified as "userName".

    res.render("profile-page", { // now testIds's objects are sent to profile-page.ejs
        userName: arr[0], // name
        classNumber: arr[1], // number
        photo: arr[2] // photo
        // <Your codes here>
    });
    
    return;
});
```
 이것은 app.get profile 했을 때인데, 먼저 눈여겨 볼 것은 requireLogin이다. 이것은 middleware로 다음과 같다.

    // A middleware to check whether a user is logged in
    const requireLogin = (req, res, next) =>
    {
	    // If a user is logged in, move to the next middleware
	    if (req.session.user) {
		    next();
	    }

	    // Else, move to the login page.
	    else {
		    res.redirect("/login");
	    }
    };


    module.exports = {requireLogin};

여기서 중요한 것은 req.session.user가 존재하는, 즉 login이 되어있는 경우에만 next()함수로 넘긴다는 것이고, 이때의 next 함수가 바로 app.get("profile")이다. 따라서 session정보가 없는 경우에 대한 예외 처리를 해줄 필요가 없다. 

우선 이 코드에서 원하는 것은 단순하다. 어떻게든 userName, classNumber, photo 정보를 testIds에서 가져와서, 이를 "profile-page"로 렌더링해주면 된다.

그런데 만약 user information이 다수인 경우, 

 const user = testIds.find(user => user.userId === userId);

위와 같이 단순한 testIds.find함수로는 원하는 user를 찾을 수 없었다. 그 이유에 대해서 추측해보자면, 아마 testIds 정보가 다음과 같이 dictionary 배열이기 때문인 것 같다.

    const testIds = [
	{
		userId: "test1", 
		password: "1111", 
		userName: "Seunghwan Lee", 
		classNumber: "2022020761", 
		photo: "http://wine.korea.ac.kr/images/photos/lee.png"
	},
	{
		userId: "test2",
		password: "2222",
		userName: "DRX Deft",
		classNumber: "19961023",
		photo: "https://www.jaxon.gg/wp-content/uploads/2022/10/Worlds_2022_Semifinals_Day2_4191-1.jpg"
	},
	{
		userId: "test3",
		password: "3333",
		userName: "DRX Pyosik",
		classNumber: "20000312",
		photo: "https://static.invenglobal.com/upload/image/2020/07/11/r1594472944647686.jpeg"
	}
    ];

따라서 다음과 같이 원하는 정보를 find해주고 배열에 담아 리턴하는 custom 함수를 만들었다.

    function findUser(element) {//argument is testIds array.
        const userId = req.session.user.userId;
        for (i=0;i<element.length;i++){//loop for array
            if(element[i].userId === userId){ //if userid is searched
                return [element[i].userName, element[i].classNumber, element[i].photo]; //return [name,number,photo]
            }
        }
        // do not need for exception process because middleware checked the request.
    }

이 함수를 통해 name, number, photo를 리턴받았고, 이를 rendering 해주면 index.js의 역할은 끝났다.


## 2.login-page.ejs

### (1) CSS

        .login-box {
            max-width: 400px;
            margin: auto;
            padding: 40px;
            border-radius: 5px;
            background-color: white;
            box-shadow: 0px 0px 1px 1px black;
        }

최대한 example 자료와 유사하게 login, profile 화면을 구성하도록 노력했다. 그러기 위해 구현한 class가 login-box 인데, max-width를 정하고 적당하게 padding으로 여유분을 남기고, margin: auto를 통해 화면 조절에 구애없이 화면의 중앙 위 부분에 오도록 하였으며, radius를 통해 box를 미적으로 아름답도록 하였으며, 테두리 설정을 위해 box-shadow를 사용했다.

        .login-box h1 {
            text-align: center;
            margin-bottom:20px;
        }

이어서 박스 안 중앙에 "Login"이란 메시지를 나타내기 위해 text-align으로 가운데 정렬하고, 이후 로그인 입력 박스와의 간격을 두었다.

        label {
            font-weight: bolder;
            display : block;
            margin-bottom : 10px;
        }

이어서 입력 박스에 대한 CSS이다. 구성하기에 앞서서, label을 custom 해서 폰트나 위치를 정해두었다. 최대한 강의자료와 비슷하게 하기 위해서 bold 체를 사용하였고, display:block해서 한 줄을 차지하도록 했다.

        input[type="ID"], input[type="password"] {
            display: block; 
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            border: 1px solid #ccc; 
            box-sizing: border-box;
        }

이어서 입력 부분인데 중요한 것은 post명령을 통해 입력하기 위해서 input class로 만들어야 하고, id와 password로 편의상 구분했다.(그냥 통합해도 상관없음)
앞에서 설명한 것은 pass 하고 눈여겨 볼 점은, login-box의 색깔을 white로 해두었기 때문에, 입력 부분의 색깔은 하얀색보다 살짝 달라야 한다. 그래서 #ccc를 채용하였고, box-sizing: border-box로 해서 실제 사이트의 입력처럼 구성해두었다.

        button[type="submit"] {
            display:block; /* display: block and margin: auto -> moves the login button to the middle of the login box*/
            margin:auto;
            background-color: #4CAF50; /* i get reference color that of github login page.*/
            color: #fff;
            padding: 10px 20px; /* sero: 10px , garo: 20px */
            border: 1px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }

마지막으로 button이다. button은 button class로 설정해서 누르면 index.js와 연결되도록 구성하였고 github login의 background color를 참고했다. 로그인 버튼은 글씨 색과 background 색이 다르도록 해서 미적으로 아름답도록 구성했고, cursor : pointer 이 부분은, Login 버튼에 마우스를 가져가면 pointer, 즉 손가락 모양으로 커서가 바뀌도록 이쁘게 구성했다.

### (2) HTML

    <form method="POST" action="/login">
    <div class="login-box">
        <h1>Login</h1>

        <!-- the input box and label for user Id -->
        <label for="userId">User ID</label>
        <input type="ID" id="userId" name="userId"/>

        <!-- the input box and label for user password -->
        <label for="password">Password</label>
        <input type="password" id="password" name="password"/>
        <!-- Your codes here -->

        <!-- the login button -->
        <button type="submit">Login</button>
        <!-- Your codes here -->
    </div>
    </form>

우선 post 명령이므로 form tag로 구성해주면 된다. 아까 설명한 대로 login box라는 클래스에 html을 넣어두어서 이 박스 안에 구현물들이 들어가도록 했다. 이때 h1 tag는 login-box class의 h1이므로 내가 커스텀한 대로 구성될 것이다.  label 과 input, button역시 그렇다. 버튼을 누르면 액션에 들어간다.


## 3.profile-page.ejs

### (1) CSS

        .profile {
            max-height: 300px;
            max-width: 400px;
            margin: auto;
            margin-top: 50px;
            padding: 10px 50px 20px;
            border: 1px solid white;
            border-radius: 5px;
            background-color: white;
            box-shadow: 0px 0px 1px 1px black;
        }


이 페이지에서는 아예 "profile" class 안에 정보를 넣어두라고 지시했으므로 login 때와 마찬가지로 profile class를 만들어준다. 만든 방법은 login-box 와 거의 차이없다.

        .profile-info {
            text-align: center;
            
        }

이어서 등장하는 name과 number에 대한 글씨는 profile-info class의 속성, 즉 가운데 정렬 속성을 받도록 하고, 글자 사이즈 크기는 그냥 h1과 p로 구분하도록 했다.

        button[type="submit"] {
            display:block;
            margin:auto;
            background-color: #4CAF50;
            color: #fff;
            padding: 10px 20px;
            border: 1px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }

button은 로그인 버튼과 거의 차이 없다.

        .picture{
            display:block;
            margin:auto;
            width:150px;
            height:100px;
            border-radius: 80%;
        }

그리고 picture인데, example과 유사하게 하기 위해 가운데 정렬시키고 border-radius 를 80%로 해서 원형에 가까운 사진을 만들어 주었다.

### (2) HTML

    <script src="index_blank.js"></script>

index.js와 연결시켜주는 코드이다. 이를 통해 rendering 정보를 불러온다.

    <img class="picture" src=<%= photo %> alt="Oops!">

이후 photo를 가져온다. photo는 <%> 태그를 통해 가져오고, testIds에 있던 것을 findUser함수의 리턴 배열의 3번째 값이다.

    <div class="profile-info">
        <!-- Your codes here -->
        <h1>Name : <%= userName %></h1>
        <p>Student Number: <%= classNumber %></p>
    </div>

Name과 Student Number 역시 findUser함수의 리턴 배열의 각각 1,2번째 값을 렌더링받고 그것을 보여준다.

    <form method="GET" action="/logout">
        <button type="submit">Logout</button>
    </form>

버튼을 누르면 logout이 실행된다.