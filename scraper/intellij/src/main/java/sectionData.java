import java.io.*;

/**
 * Created by fu-fu on 4/9/17.
 */
public class sectionData implements Serializable{

    //DB:

    // int id,  (Special) type,   int number (of what - l01 /ect), String time <mon/tue/wen/thu/fri/sat/sun>,<start-time>,<end-time
    // String Location, int semesterID,    String TA_name (always null :/),     String InstructorName,
    // int CourseNum, String dept_name //Supposed to be dept, but it's really just subjects.

    int id;
    String type; //lec, tut, lab
    String typeNum; // 01B but just the number.
    String time;    // Time
    String room;    // Room
    String location;
    int semesterID; //Link to semester
    String TAName = null;  //haha. nope.
    String InstructorName;  //Johnathan Joe.
    String prefixNum;          //Course's number ex: 471
    String deptName;     // CPSC/SENG

    String status;          //I WANT DIS.

    //Multi-processing/continuing things:"
    boolean complete = false;

    public sectionData(int id, int semesterID){
        this.id = id;
        this.semesterID = semesterID;
    }
    public sectionData(int id, String type, String typeNum, String time, String room, String location, int semesterID, String TAName, String InstructorName, String prefixNum, String deptName,String status){
        this.id = id;
        this.type = type;
        this.typeNum = typeNum;
        this.time = time;
        this.room = room;
        this.location = location;
        this.semesterID = semesterID;
        this.TAName = TAName;
        this.InstructorName = InstructorName;
        this.prefixNum = prefixNum;
        this.deptName = deptName;
        this.status = status;

        complete = true; //Is complete when parsed (:o)
    }

    public String toString(){
        String delim = "`";
        return "SectionData"+delim+id+delim+type+delim+typeNum+delim+time+delim+room+delim+location+delim+semesterID+delim+TAName+delim+InstructorName+delim+prefixNum+delim+deptName+delim+status;
    }
    //Parsable:
    //Title:                                                    :   DERIVED_CLSRCH_DESCR200 (e.getText)

    //Status <Open/closed/..?> (Probably best to be a string)   :   SSR_CLS_DTL_WRK_SSR_DESCRSHORT (e.getText)
    //Class Number (The ID)                                     :   SSR_CLS_DTL_WRK_CLASS_NBR   (e.getText)
    //Session: "Regular Academic" (String)                      :   PSXLATITEM_XLATLONGNAME$31$ (e.getText)
    //Units: 3,6 (Possibly best to handle as string..)          :   SSR_CLS_DTL_WRK_UNITS_RANGE (e.getText)
    //Class Components: "Labratory Required" (String)           :   win0divSSR_CLS_DTL_WRK_SSR_COMPONENT_LONG (Algorithm needed)
    //Career: "Undergraduate Programs" (String)                 :   PSXLATITEM_XLATLONGNAME (e.getText)
    //Dates: "2017/1/9 - 2017/4/12" (two Strings?)              :   SSR_CLS_DTL_WRK_SSR_DATE_LONG (e.getText)
    //Grading: "Graded" (String)                                :   GRADE_BASIS_TBL_DESCRFORMAL (e.getText)
    //Location: "Main campus" (String)                          :   CAMPUS_LOC_VW_DESCR (e.getText)
    //Campus: "University of Calgary" (String)                  :   CAMPUS_TBL_DESCR (e.getText)
    //Meeting Info: //OH GOD A TABLE OF HELL.                   :   win0divSSR_CLSRCH_MTG$0     (ALGOIRTHM)
        //Days & time (String)
        //Room        (String)
        //Instructor  (String)
        //Dates       (String)
    /*
    Enrollment:
        Enrollment Requirments: (STRING):   SSR_CLS_DTL_WRK_SSR_REQUISITE_LONG  (e.getText)
            Restricted:
            Prerequisites:
        Class Attributes:   (STRING):   SSR_CLS_DTL_WRK_SSR_CRSE_ATTR_LONG (e.getText)
            Half-Course (??)
            GFC Hours (3-0) (??)

  Class Restrictions:
    ID:
    Restriction Nbr:
    Start Date:
    End Date:
    Reserved Seats:
    Description:

  Class Availability:
    Class Capacity:                 SSR_CLS_DTL_WRK_ENRL_CAP (e.getText)
    Enrollment Total:               SSR_CLS_DTL_WRK_ENRL_TOT    (e.getText)
    Available Seats:                SSR_CLS_DTL_WRK_AVAILABLE_SEATS (e.getText)
    Wait List Capacity:             SSR_CLS_DTL_WRK_WAIT_CAP
    Wait List Total:                win0divSSR_CLS_DTL_WRK_WAIT_TOT

  Notes:
    Class Notes:

  Description:                      DERIVED_CLSRCH_DESCRLONG (e.getText)
    //Desc:
    //Prerequisites:
    //Antirequisites:
    //Notes:

  Textbooks/Other Materials:        SSR_CLS_DTL_WRK_SSR_CLS_TXB_MSG (e.getText)

    */


    public static void saveSection(sectionData sem){
        try {
            System.out.println("Saving semester: "+sem.semesterID+".s.obj");
            ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream(new File(sem.semesterID+".obj")));
            out.writeObject(sem);
            out.flush();
            out.close();

        }catch(Exception e3){
            e3.printStackTrace();
        }
    }
    public static sectionData loadSection(int lid){
        sectionData sem = null;
        try {
            ObjectInputStream in = new ObjectInputStream(new FileInputStream(new File(lid+".s.obj")));
            sem = (sectionData) in.readObject();
            System.out.println("Loading semester: "+lid+".obj");
        }catch(Exception e4){
            //e4.printStackTrace();
        }
        return(sem);
    }

}
