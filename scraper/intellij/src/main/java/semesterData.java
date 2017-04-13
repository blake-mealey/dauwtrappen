import org.apache.commons.io.output.WriterOutputStream;
import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.Select;

import java.io.*;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Scanner;

import static java.lang.Integer.min;

/**
 * Created by scott.saunders on 4/8/17.
 */
public class semesterData extends Thread implements Serializable{
    int semester_id;

    boolean subjects_parsed=false;
    HashSet<String> parsedSubjects = new HashSet<String>();
    boolean complete=false;


    HashMap<String,String> subjects = new HashMap<String,String>();
    HashMap<Integer,sectionData> sections= new HashMap<Integer,sectionData>();
    HashMap<Integer,classData> classes= new HashMap<Integer,classData>();

    public static void selectSemester(WebDriver drv, int semester_id){
        //Get accesses
        //scraper.get_access(drv);
        //Select the class.
        new Select(drv.findElement(By.id(scraper.Term_Selection_id))).selectByValue(String.valueOf(semester_id));
        scraper.wait(drv);

    }

    public semesterData(int semester_id){
        this.semester_id = semester_id;
        complete = false;
        subjects_parsed=false;
    }

    public void run(){
        WebDriver drv = scraper.setup_driver();
        scraper.get_access(drv);
        //try{Thread.sleep(10000);}catch(Exception e){};
        run(drv);
        try {
            drv.close();
            drv.quit();
        }catch(Exception e){}

    }
    public void run(WebDriver drv){

        this.ParseSubjects(drv);
        this.subjects_parsed=true;
        this.getData(drv);
        this.complete = true;
        semesterData.saveSemester(this);

    }


    public void ParseSubjects(WebDriver drv){
        //WebDriver drv = scraper.driver;
        selectSemester(drv, semester_id);
        //

        List<WebElement> elems = scraper.getOptions(drv, scraper.Subject_Selection_id );

        if(subjects != null)
            subjects.clear();   //PURGE THE OLD DATA!

        for (WebElement e : elems){
            //By default the webpage has a empty option first.
            if(e.getAttribute("value") == null || e.getAttribute("value").equals(""))
                continue;
            //Print out the found value and the string:
            //System.out.println(e.getAttribute("value") +" : "+ e.getText());

            String abbr = e.getAttribute("value");
            String full = e.getText().split("-")[1].trim();

            subjects.put(abbr,full);

            //Print what we just stored.
            //System.out.println(val +" : "+ txt);
        }



    }

    public void getData(){
        getData2(null,this);
    }
    public void getData(WebDriver drv){
        getData2(drv,this);
    }

    public static void getData2(WebDriver drv, semesterData semester){
        if(drv == null){
            drv = scraper.setup_driver();
        }
        for(String subject : semester.subjects.keySet()) {

//            if(semester.parsedSubjects.contains(subject))   //Skip if already parsed TODO
//                continue;

            for (int i = 0; i < 10; i++) { //Does it contain a 0? How about 1...
                scraper.SearchFor(drv, semester, subject, i, "C");
                try {
                    String err = drv.findElement(By.id(scraper.search_msg_id)).getText();
                    if (err.toLowerCase().contains("no results"))
                        continue;
                    if(err.toLowerCase().contains("limit of 250 sections")){
                        getSubjectIterative(drv,semester,subject); //Fallback to iteration
                        break;
                    }
                } catch (NoSuchElementException e) {
                }

                parseSearch(drv,semester,subject); //Parse it
                semesterData.saveSemester(semester);    //Partial saves
            }
//            semester.parsedSubjects.add(subject);   //Note it as parsed.  //TODO

        }

    }

    public static void getSubjectIterative(WebDriver drv, semesterData semester, String subject){
        for(int i=1; i<1000; i++){
            scraper.SearchFor(drv,semester,subject,i);
            try {
                String err = drv.findElement(By.id(scraper.search_msg_id)).getText();
                if (err.toLowerCase().contains("no results"))
                    continue;
            }catch(NoSuchElementException e){
                //Oh good, there was no error, this is something we actually want!
                //System.out.println("Found course: "+scraper.Semesters.get(semester.semester_id)+" "+subject+" "+i);
            }
            parseSearch(drv,semester,subject);
        }

    }
    public static void getDataIterative(WebDriver drv, semesterData semester){

        for(String subject : semester.subjects.keySet()){
            getSubjectIterative(drv,semester,subject);
        }
    }

    public static void parseSearch(WebDriver drv,semesterData semester, String subject){

        try {
            String err = drv.findElement(By.id(scraper.search_msg_id)).getText();
            if (err.toLowerCase().contains("no results"))
                return;
        }catch(NoSuchElementException e){
            //Oh good, there was no error, this is something we actually want!
            //System.out.println("Found course: "+scraper.Semesters.get(semester.semester_id)+" "+subject);
        }

        //BIG COMMENT OF IDS:

        //Big table ID: ACE_DERIVED_CLSRCH_GROUP6
        //Row1 of first element:    trSSR_CLSRCH_MTG1$0_row1
        //Row1 of second element:   trSSR_CLSRCH_MTG1$1_row1
        //Row2 of second element:   trSSR_CLSRCH_MTG1$2_row1

        //Seems like they iterate over the thing, only ever with row1.
        //So-far seems to do that.

        //Geting num-rows:
        //win0divSSR_CLSRSLT_WRK_GROUPBOX1 has a SSSGROUPBOX,
        //Porbably eaiser to get it via findByVisableText(class section(s) found);


        //Note: Some of these may not exists! Need to try-catch each attmept.
        //Note: The numbers following the $ are very based on the row being probed.


        //Class ID: MTG_CLASS_NBR$8
        //Javascript run when clicked: javascript:submitAction_win0(document.win0,'MTG_CLASS_NBR$8');
        //Class Num/Lab ID: MTG_CLASSNAME$29
        //Date/time: MTG_DAYTIME$29
        //Location: UCSS_E010_WRK_DESCR$1   (MainCampus)
        //Room: MTG_ROOM$0
        //Instructor: MTG_INSTR$0
        //Section Group: UCSS_E010_WRK_ASSOCIATED_CLASS$81 //This is the "Lec 01 needs lab1-3, etc.
        //Status:   win0divDERIVED_CLSRCH_SSR_STATUS_LONG$0     //This is a parent of a picture, the child's alt is the value.
        //Restrictions: UCSS_E010_WRK_HTMLAREA$1

        scraper.wait(drv);  //Wait for anything.


        //For semester 2167 this seems to be missing.
        WebElement e;
        try {
            e = drv.findElement(By.id("win0divSSR_CLSRSLT_WRK_GROUPBOX1")).findElement(By.className("SSSGROUPBOX"));
            //In overnight run, the above failed at one point.
        }catch(Exception err){
            System.out.println("BUG: semester:"+semester.semester_id+", subject: "+subject);
            err.printStackTrace();
            return; //Stop trying for this page.
        }

        int numrows = Integer.parseInt(e.getText().split(" ")[0]);
        //System.out.println("Found "+ numrows+ " rows.");

        //Get course ID's for each row:
        String[] prefixnums = new String[numrows];
        String[] subNames = new String[numrows];


        //BOXID: SSR_CLSRSLT_WRK_GROUPBOX2$0
        int startrow= 0;

        for(int i=0; i<numrows; i++){
            WebElement test;
            try { test = drv.findElement(By.id("win0divSSR_CLSRSLT_WRK_GROUPBOX2$" + i));
            }catch(Exception e5){
                if(startrow != numrows-1)
                    System.out.println("Didn't give every row of sections number, this is probably bad. stopped at "+startrow);
                //e5.printStackTrace();
                break;
            }

            String classNum = null;
            String subName = null;
            try{
                classNum = test.findElement(By.id("win0divSSR_CLSRSLT_WRK_GROUPBOX2GP$"+i)).getText().split("-")[0].trim().split(" ")[1].trim();
                subName = test.findElement(By.id("win0divSSR_CLSRSLT_WRK_GROUPBOX2GP$"+i)).getText().split("-")[0].trim().split(" ")[0].trim();
            }catch(Exception e4){
                System.out.println("Badparse: "+test.getText());
            }

            for(int j=startrow; j<numrows; j++){
                boolean found = false;
                try{//Try to find it
                    test.findElement(By.id("MTG_CLASS_NBR$"+j));
                    found = true;
                }catch(Exception e3) {
                    //System.out.println("Not found");
                }

                if(found){
                    prefixnums[j] = classNum;
                    subNames[j] = subName;
                    startrow=j;
                }else{
                    startrow=j;
                    break;
                }
            }
        }

        //Get data from row
        for(int i=0; i< numrows; i++){
            //TODO: Handle when any of these don't exists. (Lots of try catch?)
            int cid = Integer.parseInt(drv.findElement(By.id("MTG_CLASS_NBR$"+i)).getText());
            String type = drv.findElement(By.id("MTG_CLASSNAME$"+i)).getText().replace("\n", ""); //TODO: Parse this into Lab/Tut/Lec and the corrisponding number.
            String time = drv.findElement(By.id("MTG_DAYTIME$"+i)).getText().replace("\n","");   //TODO: Parse this into Mon/Tue/Wen/Thur/Fri/Sat/Sun with startime and endtime.
            String location = drv.findElement(By.id("UCSS_E010_WRK_DESCR$"+i)).getText().replace("\n","");
            String room = drv.findElement(By.id("MTG_ROOM$"+i)).getText().replace("\n","");
            String instructor = drv.findElement(By.id("MTG_INSTR$"+i)).getText().replace("\n","");
            int secgrp = Integer.parseInt(drv.findElement(By.id("UCSS_E010_WRK_ASSOCIATED_CLASS$"+i)).getText());
            String status = drv.findElement(By.id("win0divDERIVED_CLSRCH_SSR_STATUS_LONG$"+i)).findElement(By.tagName("img")).getAttribute("alt").replace("\n","");
            try{String restrictions = drv.findElement(By.id("UCSS_E010_WRK_HTMLAREA$"+i)).getText().replace("\n","");}catch(Exception e2){}

            String type_str = null;
            String nullstr = null;
            String type_num = null;

            if(type.toLowerCase().contains("tut")){
                type_str="tut";
                type_num=type.split("-")[0].substring(1).trim();
            }else if(type.toLowerCase().contains("lec")) {
                type_str="lec";
                type_num=type.split("-")[0].trim();
            }else if(type.toLowerCase().contains("lab")) {
                type_str="lab";
                type_num=type.split("-")[0].substring((1)).trim();
            }

            if(! semester.sections.containsKey(cid)) {
                sectionData tmp = new sectionData(cid, type_str, type_num, parseTime(time), room,location, semester.semester_id, nullstr, instructor, prefixnums[i], subNames[i],status);
                semester.sections.put(cid,tmp);
                //System.out.println(tmp);
            }


        }
    }
    //<mon/tue/wen/thu/fri/sat/sun>,<start-time>,<end-time>
    public static String parseTime(String timein){
        String ret = new String();
        boolean first = true;

        if(timein.toLowerCase().contains("tba"))
            return timein;

        int numDiffTimes = timein.split(":").length/2;


        //for(int i=0;i< numDiffTimes; i++) {   //TODO: There is a bug, this only grabs the first time. For demo and time reasons, ignoring. (There can be more than one time, apprently.)

            String startTime = timein.split(" ")[1];
            String endTime = timein.split(" ")[3];

            endTime = endTime.substring(0, min(endTime.length(), endTime.lastIndexOf(':') + 5)); //Remove any little extra bits //TODO: This is how I hide the above todo.

            if (timein.toLowerCase().contains("mo")) {
                ret += "mon," + startTime + "," + endTime;
                first = false;
            }
            if (timein.toLowerCase().contains("tu")) {
                if (!first)
                    ret += ".";
                first = false;
                ret += "tue," + startTime + "," + endTime;
            }
            if (timein.toLowerCase().contains("we")) {
                if (!first)
                    ret += ".";
                first = false;
                ret += "wen," + startTime + "," + endTime;
            }
            if (timein.toLowerCase().contains("th")) {
                if (!first)
                    ret += ".";
                first = false;
                ret += "thr," + startTime + "," + endTime;
            }
            if (timein.toLowerCase().contains("fr")) {
                if (!first)
                    ret += ".";
                first = false;
                ret += "fri," + startTime + "," + endTime;
            }
            if (timein.toLowerCase().contains("sa")) {
                if (!first)
                    ret += ".";
                first = false;
                ret += "sat," + startTime + "," + endTime;
            }
            if (timein.toLowerCase().contains("su")) {
                if (!first)
                    ret += ".";
                first = false;
                ret += "sun," + startTime + "," + endTime;
            }
        //}

        return ret;
    }

    public static void saveSemester(semesterData sem){
        saveAsStr(sem); //Call a save to STR-version, for future-data-reusing(?)
        if(true)
            return; //Skips the object save.

        try {
            //System.out.println("Saving semester: "+sem.semester_id+".obj");

            File f = new File(sem.semester_id+".obj");
            if(f.exists()) {
                f.delete();

            }

            f.createNewFile();

            ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream( f));
            out.writeObject(sem);
            out.flush();
            out.close();

        }catch(Exception e3){
            e3.printStackTrace();
        }
    }
    public static semesterData loadSemester(int lid){
        if(true)
            return semesterData.loadAsStr(lid); //Skips the object load

        semesterData sem = null;
        try {
            File f = new File(lid+".obj");
            ObjectInputStream in = new ObjectInputStream(new FileInputStream(f));
            sem = (semesterData) in.readObject();
            //System.out.println("Loading semester: "+lid+".obj");
        }catch(Exception e4){
            //e4.printStackTrace();
        }
        return(sem);
    }

    public String toString(){
        String ret = new String();
        for( int i : sections.keySet()){
            ret += sections.get(i).toString() +"\n";
        }
        return ret;
    }

    public static void saveAsStr(semesterData sem){
        try {
            File f = new File(sem.semester_id + ".str");

            BufferedWriter bw = new BufferedWriter(new FileWriter(f));
            for(int i : sem.sections.keySet()) {
                bw.write(sem.sections.get(i).toString()+"\n");
            }
            if(sem.complete)
                bw.write("complete\n");
            bw.flush();
            bw.close();

            //Old method: (Gets too long and fails.)
            //new DataOutputStream(new FileOutputStream(f)).writeUTF(sem.toString());
        }catch(Exception e5){e5.printStackTrace();}

    }

    public static semesterData loadAsStr(int id){
        semesterData ret = new semesterData(id);
        try{

            File f = (new File(id+".str"));
            if(!f.exists())
                return null;

            BufferedReader br = new BufferedReader(new FileReader(f));
            String line;
            while(( line = br.readLine()) != null){

                String[] elems = line.split("`");
                //System.out.println("Loading line: "+line);

                sectionData a = null;

                if (line != null && line.equals("complete")){
                    ret.complete = true;
                    continue;
                }

                if(elems.length == 12) {
                    //System.out.println("Old data, parsing");
                    a = new sectionData(Integer.parseInt(elems[1]), elems[2], elems[3], elems[4], "OldDataErrorFixed", elems[5], Integer.parseInt(elems[6]), elems[7], elems[8], elems[9], elems[10], elems[11]);
                }
                if(elems.length == 13) {
                    a = new sectionData(Integer.parseInt(elems[1]), elems[2], elems[3], elems[4], elems[5], elems[6], Integer.parseInt(elems[7]), elems[8], elems[9], elems[10], elems[11], elems[12]);
                }

                if(a!=null) {
                    ret.sections.put(a.id, a);
                }


            }
        }catch(Exception e6){
            e6.printStackTrace();
        }
        return ret;
    }

}
