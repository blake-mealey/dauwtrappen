import io.github.bonigarcia.wdm.ChromeDriverManager;
import io.github.bonigarcia.wdm.FirefoxDriverManager;
import io.github.bonigarcia.wdm.PhantomJsDriverManager;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.phantomjs.PhantomJSDriver;
import org.openqa.selenium.support.ui.Select;

import java.io.File;
import java.sql.*;
import java.util.*;
//import org.

//import io.github.bonigarcia.wdm


//import java.util.concurrent.TimeUnit;

/**
 * Created/home/fu-fu by fu-fu on 3/10/17.
 */

public class scraper {


    static WebDriver driver = null;

    //Static ID's
    static String wait_id = "WAIT_win0";

    //Search ID's
    static String Term_Selection_id="CLASS_SRCH_WRK2_STRM$35$";
    static String Subject_Selection_id="SSR_CLSRCH_WRK_SUBJECT_SRCH$0";

    static String course_number_selector_id="SSR_CLSRCH_WRK_SSR_EXACT_MATCH1$1";
    static String show_open_classes_only_id="SSR_CLSRCH_WRK_SSR_OPEN_ONLY$3";
    static String contains_number_box_id="SSR_CLSRCH_WRK_CATALOG_NBR$1";
    static String search_button_id="CLASS_SRCH_WRK2_SSR_PB_CLASS_SRCH";
    static String search_msg_id="DERIVED_CLSMSG_ERROR_TEXT";

    static int delay= 1000; //100 too small


    public static void get_access(WebDriver driver){

        //Uses the public link
        driver.get("https://csprd.ucalgary.ca/psauthent/class-search/public");

        //Gets the internal iframe.
        driver.get(driver.findElement(By.id("ptifrmtgtframe")).getAttribute("src"));

    }

    static boolean setupHasRun = false;
    public static WebDriver setup_driver(){
        return setup_driver(null); //Give it the default.
    }
    public static WebDriver setup_driver(String useDriver){
        //ChromeDriverManager.getInstance().setup();
        //InternetExplorerDriverManager.getInstance().setup();
        //OperaDriverManager.getInstance().setup();
        //EdgeDriverManager.getInstance().setup();
        //PhantomJsDriverManager.getInstance().setup();

        if(useDriver == null)
            useDriver = "f";    //Default.

        if(!setupHasRun) {
            if(useDriver.contains("p"))
                PhantomJsDriverManager.getInstance().setup();
            if(useDriver.contains("c"))
                ChromeDriverManager.getInstance().setup();
            if(useDriver.contains("f"))
                FirefoxDriverManager.getInstance().setup();
            setupHasRun = true;
        }

        if(useDriver.contains("p"))
            driver = new PhantomJSDriver();
        if(useDriver.contains("c"))
            driver = new ChromeDriver();
        if(useDriver.contains("f"))
            driver = new FirefoxDriver();

        return driver;
    }

    static HashMap<Integer,String> Semesters;

    public static void main(String args[]){

        boolean noSQL = false;
        boolean noScrape = false;
        boolean multiThread =false;
        boolean dumbTest = false; //Manual SQL tests.
        ArrayList<Integer> scrapeSemesters = null;

        String scrapeDriverType = null;

        //while(int i=0; i< args ; i++)
        int piter=0;
        while(piter < args.length){
            String arg = args[piter++];
            switch (arg.toLowerCase()) {
                case "--nosql":
                    noSQL = true;
                    break;
                case "--noscrape":
                    noScrape = true;
                    break;
                case "--sem":   case"-s":
                    if(scrapeSemesters == null)
                        scrapeSemesters = new ArrayList<Integer>();
                    arg = args[piter++];
                    for(int j =0; j < arg.split(",").length; j++){
                        scrapeSemesters.add(Integer.parseInt(arg.split(",")[j]));
                    }
                    break;
                case "--multithread":case"-mt":case"-m":
                    multiThread = true;
                    break;
                case "--firefox":case"-ff":case"-f":
                    scrapeDriverType = "f";
                    break;
                case "--chromium":case"--chrome":case"-c":
                    scrapeDriverType = "c";
                    break;
                case "--phantomjs":case"--phantom":case"-p":
                    scrapeDriverType = "p";
                    break;
                case "--dumbTest":
                    dumbTest = true;
                    break;
            }

        }

        if(dumbTest) {
            setupSql();
            //semesterData testdata = semesterData.loadAsStr(2161); //Raw-load data.
            semesterData testdata = new semesterData(1337);
            testdata.sections.put(42, new sectionData(42, "tut", "01", "lATER", "Somewhere-else","AROOM", 1337, "some bloke", "some better bloke.", "123", "AWE", "NOT OPEN FOR ANYONE"));
            Semesters = new HashMap<Integer,String>();
            Semesters.put(testdata.semester_id, "leet");

            putSQL(testdata);
            System.exit(0);
        }

        if(noScrape){
            if(scrapeSemesters == null){
                System.out.println("No scraping, and no semesters to put. I'm done then, yay!");
                System.exit(0);
            }
            if(noSQL){
                System.out.println("No scraping, and no sqling. I guess i'll go die then.");
                System.exit(0);
            }

            Semesters = new HashMap<Integer,String>();
            for(int i : scrapeSemesters){
                semesterData load = semesterData.loadAsStr(i);
                if(load != null){
                    Semesters.put(i,i+"Unknown, I don't save this. (yet)"); //TODO.
                    putSQL(load);
                }
            }
            System.exit(0);
        }

        boolean SQL_INNER = true;

        driver = setup_driver(scrapeDriverType);

        //GET SEMESTERS! YAY!
        Semesters = getSemesters();

        //Get ready for data!
        HashMap<Integer,semesterData> sdata = new HashMap<Integer,semesterData>();

        HashSet<Thread> threads = new HashSet<Thread>();

        //To handle parsing, we put all semesters in this.
        if(scrapeSemesters == null){
            scrapeSemesters = new ArrayList<Integer>();
            for(Integer semester : Semesters.keySet()){
                scrapeSemesters.add(semester);
            }
        }

        //Get da https://en.wikipedia.org/wiki/File:DataTNG.jpg
        for(Integer semester : scrapeSemesters){
            semesterData s = new semesterData(semester);
            semesterData r = semesterData.loadSemester(semester);

            if(r != null && r.complete){    //Try to load if available.
                s=r;    //TODO: Handle partal loads.
            }else {
                if(multiThread){
                    Thread t = new Thread(s);
                    threads.add(t);
                    t.start();
                }else {
                    try{s.run(driver);}catch(Exception ohgod){System.out.println("BUG:"); ohgod.printStackTrace();}
                }
            }
            if(!noSQL && SQL_INNER ){
                try {
                    putSQL(s);
                }catch(Exception guessnot){guessnot.printStackTrace();}
            }else {
                sdata.put(semester, s);
            }
        }

        if(multiThread){
            for(Thread t : threads){
                try{t.join();}catch(Exception e){}
            }
        }

        if(!noSQL && !SQL_INNER){ //Might play nicer with multithreading.
            for(int semID :sdata.keySet()){
                putSQL(sdata.get(semID));
            }
        }

        try {
            driver.close();
            driver.quit();
        }catch(Exception e42){
            //It's shutting down, w.e
        }
        System.out.println("Goodbye.");

    }


    public static List<WebElement> getOptions(WebDriver drv, String id){
        WebElement elem = drv.findElement(By.id(id));
        return elem.findElements(By.tagName("option"));
    }

    public static HashMap<Integer,String> getSemesters(){
        get_access(driver);

        List<WebElement> elems = getOptions(driver,Term_Selection_id);

        HashMap<Integer,String> ret = new HashMap<Integer,String>();

        for (WebElement e : elems){

                //By default the webpage has a empty option first.
            if(e.getAttribute("value") == null || e.getAttribute("value").equals(""))
                continue;
            //Print out the found value and the string:
            //System.out.println(e.getAttribute("value") +" : "+ e.getText());

            int val = Integer.parseInt(e.getAttribute("value"));
            String txt = e.getText().split("-")[1].trim();

            ret.put(val,txt);

            //Print what we just stored.
            //System.out.println(val +" : "+ txt);

        }
        return ret;

    }


    public static void searchFor(WebDriver drv, semesterData semester, String subject, int contains){
        searchFor(drv,semester,subject,contains,"E");
    }
    //Types:
    //E - Exactly
    //C - Contains
    //G - Greater than or equal to
    //T - Less than or equal to
    public static void searchFor(WebDriver drv, semesterData semester, String subject, int contains, String type){

        subject = subject.toUpperCase();

        //Checks the subject string
        boolean found = false;
        for(String str : semester.subjects.keySet()) {
            if(str.equals(subject)){
                found=true;
                break;
            }
        }

        if(!found){
            System.out.println("Invalid subject string: "+subject+" for semester: " +semester.semester_id);
            System.exit(42);
        }


        get_access(drv);
        semesterData.selectSemester(drv,semester.semester_id);

        //Click the Open_Only (To show all classes)
        drv.findElement(By.id(show_open_classes_only_id)).click();

        //Select Subject
        Select select = new Select(drv.findElement(By.id(Subject_Selection_id)));
        select.selectByValue(subject);

        //Select "Is exactly."
        new Select(drv.findElement(By.id(course_number_selector_id))).selectByValue(type);

        //Put in contains
        WebElement cont =drv.findElement(By.id(contains_number_box_id));
        cont.sendKeys(String.valueOf(contains));

        drv.findElement(By.id(search_button_id)).click();

        wait(drv);

    }

    public static void hitOK(WebDriver drv){
        try{
            drv.findElement(By.id("#ICSave")).click();
        }catch(Exception idc){
            //I SAID I DON CARE.
        }
    }

    public static void wait(WebDriver drv){

        while(true) {

            hitOK(drv); //OKAY IS OKAY HIT OKAY OKAY?

            try {
                if (!drv.findElement(By.id(wait_id)).isDisplayed())
                    break;
            }catch(Exception e){
                //Well it's obviously not displayed then.
            }

            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }

    }

    //SQL BITS:

    static Connection sqlCon;

    static String sqlUrl = "jdbc:postgresql://localhost/ddn_db";
    static String sqlUser = "postgres";
    static String sqlPassword = "carrots";
    static int sqlPort = 5432;

    static boolean sql_setup = false;
    public static void setupSql(){
        if(sql_setup)
            return;
        sql_setup = true;
        try {
        sqlCon = DriverManager.getConnection(sqlUrl, sqlUser, sqlPassword);
        Statement sqlState;
        ResultSet sqlResults;
        sqlState = sqlCon.createStatement();
        sqlResults = sqlState.executeQuery("SELECT VERSION()");

            if (sqlResults.next()) {
                System.out.println(sqlResults.getString(1));
            }
        }catch(Exception e10){
            e10.printStackTrace();
            System.out.println("SQL FAILED, ABORTING!");
            System.exit(1);
        }
        nukeDb();
    }
    public static void nukeDb(){
        //Nuke the database!
        scraper.setupSql();
        try {
            sqlCon.createStatement().execute(new Scanner(new File("database.sql")).useDelimiter("\\Z").next()); //Use the database.sql file to nuke it.
        }catch(Exception e11){
            e11.printStackTrace();
        }
    }
    public static void putSQL(semesterData semester){
        scraper.setupSql(); //Try to setup SQL.

        HashSet<String> Departments = new HashSet<String>();
        //Faculties made from first char of Departments.
        //Courses made from prefixNum and subject of section.
        HashMap<String,String[]> Courses = new HashMap<String,String[]>();
        //ID (num+dept), {Num, Dept.}
        HashSet<String> Teachers = new HashSet<String>();

        //Generate data for SQL.
        for(int sectID : semester.sections.keySet()) {
            sectionData sect = semester.sections.get(sectID);
            String temp = sect.deptName.toUpperCase();

            Departments.add(temp);

            Courses.put(sect.prefixNum+sect.deptName, new String[]{sect.prefixNum,sect.deptName});

            Teachers.add(sect.InstructorName);
        }


        try{
            //UPDATE SEMESTERS
            //"id int PRIMARY KEY, name text";
            PreparedStatement qs = sqlCon.prepareStatement("INSERT INTO semester VALUES(?,?) ON CONFLICT DO NOTHING");
            qs.setInt(1,semester.semester_id);
            qs.setString(2,Semesters.get(semester.semester_id));
            qs.execute();

        }catch(Exception sql3){sql3.printStackTrace();}

        for(String dept : Departments) {
            try {
                //Faculty (C)
                //INSERT INTO faculty VALUES(%L) ON CONFLICT DO NOTHING, faculty
                PreparedStatement qs = sqlCon.prepareStatement("INSERT INTO faculty VALUES(?) ON CONFLICT DO NOTHING");
                qs.setString(1, dept.substring(0, 1));
                qs.execute();

                //Update Departments. (CPSC, NULL)
                //INSERT INTO department VALUES(%L,%L) ON CONFLICT DO NOTHING,  dept, dept)
                qs = sqlCon.prepareStatement("INSERT INTO department VALUES(?,?) ON CONFLICT DO NOTHING");
                qs.setString(1, dept);
                //qs.setString(2, semester.subjects.get(dept)); //FULL NAME //TODO: FIX THIS.
                qs.setString(2, dept);
                qs.execute();

                //Link Faculty to Dept (C,CPSC)
                //"INSERT INTO faculty_contains VALUES(%L,%L) ON CONFLICT DO NOTHING", faculty, dept);
                qs = sqlCon.prepareStatement("INSERT INTO faculty_contains VALUES(?,?) ON CONFLICT DO NOTHING");
                qs.setString(1, dept.substring(0, 1));
                qs.setString(2, dept);
                qs.execute();

            }catch(Exception sql0){sql0.printStackTrace();}
        }

        for(String key: Courses.keySet()) {
            String[] vals = Courses.get(key);
            try {
                //Update Course.
                //(NULL NULL, 471, CPSC)
                //("INSERT INTO course VALUES(%L,%L,%L,%L) ON CONFLICT DO NOTHING", name, name, num, dept);

                PreparedStatement qs = sqlCon.prepareStatement("INSERT INTO course VALUES(?,?,?,?) ON CONFLICT DO NOTHING");
                qs.setString(1,vals[1]); //Placeholders.
                qs.setString(2,vals[1]);
                qs.setString(3,vals[0]);
                qs.setString(4,vals[1]);
                qs.execute();

            }catch(Exception sql1){sql1.printStackTrace();}
        }

        for(String teach : Teachers) {
            try {

                //Update Instructors (BLOKE)
                //"INSERT INTO instructor VALUES(%L) ON CONFLICT DO NOTHING", name
                PreparedStatement qs = sqlCon.prepareStatement("INSERT INTO instructor VALUES(?) ON CONFLICT DO NOTHING");
                qs.setString(1,teach);
                qs.execute();

            }catch(Exception sql2){
                sql2.printStackTrace();
            }
        }
        for(int sectID : semester.sections.keySet()) {
            sectionData sect = semester.sections.get(sectID);
            try {
                //Update Course_section
                //INSERT INTO semester VALUES(%s,%L) ON CONFLICT DO NOTHING , semester.name, semester.desc);

                //("INSERT INTO course_section VALUES(%L,%s,%s,%s,%L,%s,NULL,%L,%L,%L) ON CONFLICT DO NOTHING",
                //   type, semester_id, section.$.name, time, section.room[0], sectionId++, section.instructor, courseNum, dept);
                PreparedStatement qs = sqlCon.prepareStatement("INSERT INTO course_section VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT DO NOTHING");
                qs.setString(1, sect.type.toUpperCase());
                qs.setInt(2, sect.semesterID);
                try{qs.setInt(3, Integer.parseInt(sect.typeNum));}
                catch(Exception e3245){
                    //System.out.println(sect.id +" has sect type: "+sect.typeNum);
                    qs.setInt(3, -1);
                }
                qs.setString(4, sect.time);
                qs.setString(5, sect.room);
                qs.setInt(6, sect.id);
                qs.setString(7, null);
                qs.setString(8, sect.InstructorName );
                qs.setString(9, sect.prefixNum );
                qs.setString(10,sect.deptName);
                qs.execute();

            } catch (Exception e12) {
                e12.printStackTrace();
            }
        }
                //Update Teaching Assistants... (sigh)

    }

}
