<grid filter="blur(10px)" drag="100 100" drop="0 0" class="fullImage">
![photo by Alex Kotliarskyi on Unsplash](https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=faces,focalpoint,center,entropy&cs=srgb&fm=jpg&ixid=M3wzNjM5Nzd8MHwxfHJhbmRvbXx8fHx8fHx8fDE2OTIyNDE1MTd8&ixlib=rb-4.0.3&q=85&w=1920&h=1080&fit=crop)
</grid>
<grid class="content bg-with-front-color" drag="90 80" drop="5 8"  align="left" style="z-index: 999;"  pad="100px" justify-content="center" >
<grid class="bg-with-back-color" drag="2 20" drop="0 10"></grid>
<% content %>
</grid>
<grid drag="50 5" drop="5 60" align="left" pad="0 0 0 100px" style="z-index: 999;">
<%? author %>
</grid>
<grid drag="50 5" drop="5 65" align="left"  pad="0 0 0 100px" style="z-index: 999;">
<%? date %>
</grid>
<grid drag="90 80" drop="5 8"  align="right"  pad="100px" class="bg-with-back-color"  style="margin-top: 40px; margin-left: 40px;" z-index="888" >

</grid>